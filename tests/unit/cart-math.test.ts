import { describe, it, expect } from "vitest";
import {
  capQuantity,
  computeCartSubtotal,
  computeCartCount,
} from "@/lib/cart-math";

describe("capQuantity", () => {
  it("returns the requested quantity when within stock", () => {
    expect(capQuantity(3, 10)).toBe(3);
  });

  it("caps at available stock", () => {
    expect(capQuantity(15, 10)).toBe(10);
  });

  it("never goes below zero", () => {
    expect(capQuantity(-5, 10)).toBe(0);
  });

  it("returns zero when stock is zero", () => {
    expect(capQuantity(5, 0)).toBe(0);
  });

  it("floors fractional quantities", () => {
    expect(capQuantity(2.9, 10)).toBe(2);
  });
});

describe("computeCartSubtotal", () => {
  it("sums price × quantity exactly (no float drift)", () => {
    const subtotal = computeCartSubtotal([
      { price: "149900.00", quantity: 2 },
      { price: "5900.50", quantity: 3 },
    ]);
    // 149900*2 + 5900.50*3 = 299800 + 17701.50 = 317501.50
    expect(subtotal.toFixed(2)).toBe("317501.50");
  });

  it("returns 0 for an empty cart", () => {
    expect(computeCartSubtotal([]).toString()).toBe("0");
  });

  it("avoids 0.1+0.2 float error", () => {
    const subtotal = computeCartSubtotal([
      { price: "0.10", quantity: 1 },
      { price: "0.20", quantity: 1 },
    ]);
    expect(subtotal.toString()).toBe("0.3");
  });
});

describe("computeCartCount", () => {
  it("sums quantities", () => {
    expect(computeCartCount([{ quantity: 2 }, { quantity: 3 }])).toBe(5);
  });

  it("returns 0 for empty", () => {
    expect(computeCartCount([])).toBe(0);
  });
});
