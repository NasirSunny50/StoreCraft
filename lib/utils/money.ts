import { Prisma } from "@prisma/client";

/**
 * Money helpers. Always operate on Prisma.Decimal — never JS float — to avoid
 * rounding errors on currency. Arithmetic for cart/coupon/order totals lives here.
 */

export type Money = Prisma.Decimal;

export function toDecimal(value: Prisma.Decimal.Value): Money {
  return new Prisma.Decimal(value);
}

export function add(a: Prisma.Decimal.Value, b: Prisma.Decimal.Value): Money {
  return new Prisma.Decimal(a).plus(b);
}

export function subtract(a: Prisma.Decimal.Value, b: Prisma.Decimal.Value): Money {
  return new Prisma.Decimal(a).minus(b);
}

export function multiply(a: Prisma.Decimal.Value, b: Prisma.Decimal.Value): Money {
  return new Prisma.Decimal(a).times(b);
}

/** Clamp to >= 0 (e.g. a discount can never push a total below zero). */
export function clampNonNegative(value: Prisma.Decimal.Value): Money {
  const d = new Prisma.Decimal(value);
  return d.isNegative() ? new Prisma.Decimal(0) : d;
}

/** Format for display, e.g. "৳1,250.00". */
export function formatBDT(value: Prisma.Decimal.Value): string {
  const num = new Prisma.Decimal(value).toFixed(2);
  const [whole, decimals] = num.split(".");
  const grouped = whole!.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `৳${grouped}.${decimals}`;
}
