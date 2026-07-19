import { describe, it, expect } from "vitest";
import {
  renderPaymentProcessingPage,
  FINALIZE_STEP,
  FINALIZE_VALUE,
} from "@/lib/payment/processing-page";

describe("renderPaymentProcessingPage", () => {
  const html = renderPaymentProcessingPage({
    actionUrl: "/api/payment/sslcommerz/success",
    fields: { tran_id: "SC-1", val_id: "V1", [FINALIZE_STEP]: FINALIZE_VALUE },
    title: "Confirming your payment",
  });

  it("posts back to the given action with the fields as hidden inputs", () => {
    expect(html).toContain('action="/api/payment/sslcommerz/success"');
    expect(html).toContain('<input type="hidden" name="tran_id" value="SC-1">');
    expect(html).toContain('<input type="hidden" name="val_id" value="V1">');
  });

  it("carries the finalize marker so the re-post runs validation", () => {
    expect(html).toContain(`name="${FINALIZE_STEP}" value="${FINALIZE_VALUE}"`);
  });

  it("auto-submits and shows the given title", () => {
    expect(html).toContain(".submit(");
    expect(html).toContain("Confirming your payment");
  });

  it("HTML-escapes field values to prevent injection", () => {
    const evil = renderPaymentProcessingPage({
      actionUrl: "/x",
      fields: { tran_id: '"><script>alert(1)</script>', amp: "a&b" },
    });
    expect(evil).not.toContain('"><script>alert(1)');
    expect(evil).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(evil).toContain('value="a&amp;b"');
  });

  it("no longer shows scary SSL wording or red styling (design regression)", () => {
    expect(html).not.toMatch(/256-bit/i);
    expect(html).not.toMatch(/\bSSL\b/);
    expect(html.toLowerCase()).not.toContain("#e74c3c");
    expect(html.toLowerCase()).not.toContain("#cf3f2f");
  });
});
