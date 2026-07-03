import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { sendEmail, emailConfigured } from "@/lib/email";
import { orderPlacedEmail, orderStatusEmail } from "@/lib/email-templates";

// Mock nodemailer so the Gmail SMTP path never opens a real connection.
type Mail = { from: string; to: string; subject: string; html: string };
type TransportCfg = { service: string; auth: { user: string; pass: string } };
const { sendMailMock, createTransportMock } = vi.hoisted(() => {
  const sendMailMock = vi.fn((_mail: Mail) => Promise.resolve({ messageId: "1" }));
  return {
    sendMailMock,
    createTransportMock: vi.fn((_cfg: TransportCfg) => ({ sendMail: sendMailMock })),
  };
});
vi.mock("nodemailer", () => ({ default: { createTransport: createTransportMock } }));

const TRANSPORT_VARS = ["GMAIL_USER", "GMAIL_APP_PASSWORD", "RESEND_API_KEY", "EMAIL_FROM", "EMAIL_FROM_NAME"] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of TRANSPORT_VARS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  sendMailMock.mockReset().mockResolvedValue({ messageId: "1" });
  createTransportMock.mockClear();
});

afterEach(() => {
  for (const k of TRANSPORT_VARS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("emailConfigured / transport selection", () => {
  it("is false when no transport is configured, and skips", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(emailConfigured()).toBe(false);
    const res = await sendEmail({ to: "a@b.c", subject: "Hi", html: "<p>x</p>" });
    expect(res).toEqual({ sent: false, error: "not-configured" });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(createTransportMock).not.toHaveBeenCalled();
  });

  it("uses Gmail SMTP when Gmail creds are set", async () => {
    process.env.GMAIL_USER = "shop@gmail.com";
    process.env.GMAIL_APP_PASSWORD = "abcd efgh ijkl mnop";
    expect(emailConfigured()).toBe(true);

    const res = await sendEmail({ to: "buyer@x.test", subject: "Order", html: "<b>hi</b>" });
    expect(res).toEqual({ sent: true });

    expect(createTransportMock).toHaveBeenCalledOnce();
    const cfg = createTransportMock.mock.calls[0]![0]!;
    expect(cfg).toMatchObject({ service: "gmail", auth: { user: "shop@gmail.com", pass: "abcd efgh ijkl mnop" } });

    expect(sendMailMock).toHaveBeenCalledOnce();
    const mail = sendMailMock.mock.calls[0]![0]!;
    expect(mail.from).toBe("StoreCraft <shop@gmail.com>");
    expect(mail.to).toBe("buyer@x.test");
    expect(mail.subject).toBe("Order");
    expect(mail.html).toBe("<b>hi</b>");
  });

  it("uses EMAIL_FROM_NAME as the Gmail display name", async () => {
    process.env.GMAIL_USER = "shop@gmail.com";
    process.env.GMAIL_APP_PASSWORD = "pw";
    process.env.EMAIL_FROM_NAME = "My Store";
    await sendEmail({ to: "b@x.test", subject: "s", html: "h" });
    expect(sendMailMock.mock.calls[0]![0]!.from).toBe("My Store <shop@gmail.com>");
  });

  it("prefers Gmail over Resend when both are configured", async () => {
    process.env.GMAIL_USER = "shop@gmail.com";
    process.env.GMAIL_APP_PASSWORD = "pw";
    process.env.RESEND_API_KEY = "re_key";
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const res = await sendEmail({ to: "b@x.test", subject: "s", html: "h" });
    expect(res).toEqual({ sent: true });
    expect(sendMailMock).toHaveBeenCalledOnce();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not throw when Gmail send fails", async () => {
    process.env.GMAIL_USER = "shop@gmail.com";
    process.env.GMAIL_APP_PASSWORD = "pw";
    sendMailMock.mockRejectedValue(new Error("SMTP auth failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await sendEmail({ to: "b@x.test", subject: "s", html: "h" });
    expect(res).toEqual({ sent: false, error: "SMTP auth failed" });
  });
});

describe("Resend fallback", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "re_test_key";
  });

  it("posts to Resend with auth header and payload", async () => {
    process.env.EMAIL_FROM = "Shop <noreply@shop.test>";
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchSpy);

    const res = await sendEmail({ to: "user@x.test", subject: "Order", html: "<b>hi</b>" });
    expect(res).toEqual({ sent: true });

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_test_key");
    expect(JSON.parse(init.body)).toEqual({
      from: "Shop <noreply@shop.test>",
      to: ["user@x.test"],
      subject: "Order",
      html: "<b>hi</b>",
    });
  });

  it("reports failure (without throwing) on non-OK response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 422, text: async () => "bad" }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await sendEmail({ to: "a@b.c", subject: "s", html: "h" });
    expect(res).toEqual({ sent: false, error: "Resend 422" });
  });
});

describe("orderPlacedEmail", () => {
  const data = {
    orderNumber: "ORD-2026-000123",
    customerName: "Rahim Uddin",
    items: [
      { name: "Sony WH-1000XM5", quantity: 2, color: "Black", lineTotal: "৳69,800.00" },
      { name: "Anker PowerCore", quantity: 1, color: null, lineTotal: "৳5,900.00" },
    ],
    subtotal: "৳75,700.00",
    shippingFee: "৳60.00",
    discount: null,
    total: "৳75,760.00",
    addressLines: ["Rahim Uddin · 01711223344", "House 12, Dhanmondi, Dhaka"],
    orderUrl: "https://shop.test/orders/ORD-2026-000123",
  };

  it("includes order number, items, totals, address and tracking link", () => {
    const { subject, html } = orderPlacedEmail(data);
    expect(subject).toBe("Order ORD-2026-000123 confirmed — StoreCraft");
    expect(html).toContain("Sony WH-1000XM5");
    expect(html).toContain("× 2");
    expect(html).toContain("৳75,760.00");
    expect(html).toContain("House 12, Dhanmondi, Dhaka");
    expect(html).toContain("https://shop.test/orders/ORD-2026-000123");
    expect(html).not.toContain("Discount");
  });

  it("shows a discount row when a discount is present", () => {
    const { html } = orderPlacedEmail({ ...data, discount: "৳500.00" });
    expect(html).toContain("Discount");
    expect(html).toContain("− ৳500.00");
  });

  it("escapes HTML in user-controlled fields", () => {
    const { html } = orderPlacedEmail({
      ...data,
      customerName: '<script>alert("x")</script>',
      items: [{ name: "A <b>bold</b> product", quantity: 1, color: null, lineTotal: "৳1.00" }],
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("A &lt;b&gt;bold&lt;/b&gt; product");
  });
});

describe("orderStatusEmail", () => {
  const base = {
    orderNumber: "ORD-2026-000123",
    customerName: "Rahim",
    orderUrl: "https://shop.test/orders/ORD-2026-000123",
  };

  it.each([
    ["CONFIRMED", "is confirmed"],
    ["SHIPPED", "has shipped"],
    ["DELIVERED", "was delivered"],
    ["CANCELLED", "was cancelled"],
  ] as const)("builds the %s email", (status, subjectPart) => {
    const { subject, html } = orderStatusEmail({ ...base, status });
    expect(subject).toBe(`Order ORD-2026-000123 ${subjectPart} — StoreCraft`);
    expect(html).toContain("ORD-2026-000123");
    expect(html).toContain(base.orderUrl);
  });

  it("includes the optional note, escaped", () => {
    const { html } = orderStatusEmail({ ...base, status: "SHIPPED", note: "Leave <at> gate" });
    expect(html).toContain("Leave &lt;at&gt; gate");
  });
});
