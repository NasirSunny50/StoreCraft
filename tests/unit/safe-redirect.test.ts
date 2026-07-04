import { describe, it, expect } from "vitest";
import { safeCallbackUrl } from "@/lib/utils/safe-redirect";

describe("safeCallbackUrl", () => {
  it("accepts internal absolute paths", () => {
    expect(safeCallbackUrl("/checkout")).toBe("/checkout");
    expect(safeCallbackUrl("/orders/ORD-1?placed=1")).toBe("/orders/ORD-1?placed=1");
  });

  it("rejects off-site / protocol-relative / non-path values", () => {
    expect(safeCallbackUrl("//evil.com")).toBeNull();
    expect(safeCallbackUrl("/\\evil.com")).toBeNull();
    expect(safeCallbackUrl("https://evil.com")).toBeNull();
    expect(safeCallbackUrl("evil.com")).toBeNull();
    expect(safeCallbackUrl("checkout")).toBeNull();
  });

  it("rejects empty / missing values", () => {
    expect(safeCallbackUrl(null)).toBeNull();
    expect(safeCallbackUrl(undefined)).toBeNull();
    expect(safeCallbackUrl("")).toBeNull();
    expect(safeCallbackUrl("   ")).toBeNull();
  });
});
