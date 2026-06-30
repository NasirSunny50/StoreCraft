import { Prisma } from "@prisma/client";
import type { CouponType } from "@prisma/client";

export type CouponLike = {
  type: CouponType;
  value: Prisma.Decimal.Value;
  minOrder: Prisma.Decimal.Value;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: Date | null;
  isActive: boolean;
};

export type CouponCheck =
  | { valid: true; discount: Prisma.Decimal }
  | { valid: false; reason: string };

/** Discount amount for a coupon vs a subtotal. Never exceeds the subtotal. */
export function computeCouponDiscount(
  type: CouponType,
  value: Prisma.Decimal.Value,
  subtotal: Prisma.Decimal.Value,
): Prisma.Decimal {
  const sub = new Prisma.Decimal(subtotal);
  const val = new Prisma.Decimal(value);
  let discount =
    type === "PERCENT" ? sub.times(val).div(100) : val;
  if (discount.greaterThan(sub)) discount = sub;
  if (discount.isNegative()) discount = new Prisma.Decimal(0);
  return discount.toDecimalPlaces(2);
}

/** Validate a coupon against a subtotal + return the discount when valid. */
export function validateCoupon(
  coupon: CouponLike,
  subtotal: Prisma.Decimal.Value,
  now: Date = new Date(),
): CouponCheck {
  if (!coupon.isActive) return { valid: false, reason: "This coupon is not active." };
  if (coupon.expiresAt && coupon.expiresAt.getTime() < now.getTime()) {
    return { valid: false, reason: "This coupon has expired." };
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, reason: "This coupon has reached its usage limit." };
  }
  const sub = new Prisma.Decimal(subtotal);
  if (sub.lessThan(coupon.minOrder)) {
    return {
      valid: false,
      reason: `Minimum order of ৳${new Prisma.Decimal(coupon.minOrder).toFixed(0)} required.`,
    };
  }
  return { valid: true, discount: computeCouponDiscount(coupon.type, coupon.value, sub) };
}
