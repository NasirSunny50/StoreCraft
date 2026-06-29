import { Prisma } from "@prisma/client";

/** Clamp a requested quantity to the inclusive range [0, stock]. */
export function capQuantity(requested: number, stock: number): number {
  if (!Number.isFinite(requested) || requested < 0) return 0;
  const intQty = Math.floor(requested);
  return Math.min(intQty, Math.max(0, stock));
}

export type SubtotalLine = {
  price: Prisma.Decimal.Value;
  quantity: number;
};

/** Sum of price × quantity across cart lines, as an exact Decimal. */
export function computeCartSubtotal(lines: SubtotalLine[]): Prisma.Decimal {
  return lines.reduce(
    (acc, line) => acc.plus(new Prisma.Decimal(line.price).times(line.quantity)),
    new Prisma.Decimal(0),
  );
}

/** Total item count (sum of quantities) — used for the header cart badge. */
export function computeCartCount(lines: { quantity: number }[]): number {
  return lines.reduce((acc, line) => acc + line.quantity, 0);
}
