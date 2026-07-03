import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { sendEmail, emailConfigured } from "@/lib/email";
import { orderPlacedEmail, orderStatusEmail } from "@/lib/email-templates";

const savedKey = process.env.RESEND_API_KEY;
const savedFrom = process.env.EMAIL_FROM;

afterEach(() => {
  if (savedKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = savedKey;
  if (savedFrom === undefined) delete process.env.EMAIL_FROM;
  else process.env.EMAIL_FROM = savedFrom;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("sendEmail", () => {
  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
  });

  it("is not configured without an API key and skips without calling fetch", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    expect(emailConfigured()).toBe(false);
    const res = await sendEmail({ to: "a@b.c", subject: "Hi", html: "<p>x</p>" });
    expect(res).toEqual({ sent: false, error: "not-configured" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts to Resend with auth header and payload when configured", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "Shop <noreply@shop.test>";
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchSpy);

    const res = await sendEmail({ to: "user@x.test", subject: "Order", html: "<b>hi</b>" });
    expect(res).toEqual({ sent: true });

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_test_key");
    const body = JSON.parse(init.body);
    expect(body).toEqual({
      from: "Shop <noreply@shop.test>",
      to: ["user@x.test"],
      subject: "Order",
      html: "<b>hi</b>",
    });
  });

  it("reports failure (without throwing) when Resend responds non-OK", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 422, text: async () => "bad" }));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await sendEmail({ to: "a@b.c", subject: "s", html: "h" });
    expect(res.sent).toBe(false);
    expect(res.error).toBe("Resend 422");
  });

  it("reports failure (without throwing) when fetch rejects", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await sendEmail({ to: "a@b.c", subject: "s", html: "h" });
    expect(res).toEqual({ sent: false, error: "network down" });
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
