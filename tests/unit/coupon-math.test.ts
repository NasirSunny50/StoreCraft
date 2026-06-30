import { describe, it, expect } from "vitest";
import { computeCouponDiscount, validateCoupon, type CouponLike } from "@/lib/coupon-math";

const base: CouponLike = {
  type: "PERCENT",
  value: 10,
  minOrder: 0,
  usageLimit: null,
  usedCount: 0,
  expiresAt: null,
  isActive: true,
};

describe("computeCouponDiscount", () => {
  it("computes a percent discount", () => {
    expect(computeCouponDiscount("PERCENT", 10, "2000").toString()).toBe("200");
  });

  it("computes a fixed discount", () => {
    expect(computeCouponDiscount("FIXED", 500, "2000").toString()).toBe("500");
  });

  it("never exceeds the subtotal", () => {
    expect(computeCouponDiscount("FIXED", 5000, "2000").toString()).toBe("2000");
  });
});

describe("validateCoupon", () => {
  it("accepts a valid coupon and returns the discount", () => {
    const r = validateCoupon(base, "2000");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.discount.toString()).toBe("200");
  });

  it("rejects an inactive coupon", () => {
    expect(validateCoupon({ ...base, isActive: false }, "2000").valid).toBe(false);
  });

  it("rejects an expired coupon", () => {
    const expired = { ...base, expiresAt: new Date("2020-01-01") };
    expect(validateCoupon(expired, "2000").valid).toBe(false);
  });

  it("rejects when usage limit reached", () => {
    expect(validateCoupon({ ...base, usageLimit: 5, usedCount: 5 }, "2000").valid).toBe(false);
  });

  it("rejects when subtotal is below minOrder", () => {
    const r = validateCoupon({ ...base, minOrder: 3000 }, "2000");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reason).toMatch(/Minimum order/);
  });
});
