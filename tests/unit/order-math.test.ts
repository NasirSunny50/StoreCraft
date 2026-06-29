import { describe, it, expect } from "vitest";
import {
  computeOrderTotals,
  canCancelOrder,
  formatOrderNumber,
} from "@/lib/order-math";

describe("computeOrderTotals", () => {
  it("adds shipping and subtracts discount", () => {
    const t = computeOrderTotals({ subtotal: "2000", shippingFee: "60", discount: "100" });
    expect(t.total.toFixed(2)).toBe("1960.00");
  });

  it("defaults shipping and discount to zero", () => {
    const t = computeOrderTotals({ subtotal: "1500" });
    expect(t.shippingFee.toString()).toBe("0");
    expect(t.discount.toString()).toBe("0");
    expect(t.total.toString()).toBe("1500");
  });

  it("never goes negative", () => {
    const t = computeOrderTotals({ subtotal: "50", shippingFee: "0", discount: "200" });
    expect(t.total.toString()).toBe("0");
  });

  it("is exact with decimals", () => {
    const t = computeOrderTotals({ subtotal: "0.10", shippingFee: "0.20" });
    expect(t.total.toString()).toBe("0.3");
  });
});

describe("canCancelOrder", () => {
  it("allows cancellation only when PENDING", () => {
    expect(canCancelOrder("PENDING")).toBe(true);
    expect(canCancelOrder("CONFIRMED")).toBe(false);
    expect(canCancelOrder("SHIPPED")).toBe(false);
    expect(canCancelOrder("DELIVERED")).toBe(false);
    expect(canCancelOrder("CANCELLED")).toBe(false);
  });
});

describe("formatOrderNumber", () => {
  it("zero-pads the sequence to 6 digits", () => {
    expect(formatOrderNumber(2026, 1)).toBe("ORD-2026-000001");
    expect(formatOrderNumber(2026, 1234)).toBe("ORD-2026-001234");
  });
});
