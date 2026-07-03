import { Prisma } from "@prisma/client";
import type { OrderStatus } from "@prisma/client";

/** Flat COD shipping fee (BDT). Decimal-safe value. */
export const SHIPPING_FEE = "60";

export type OrderTotals = {
  subtotal: Prisma.Decimal;
  shippingFee: Prisma.Decimal;
  discount: Prisma.Decimal;
  total: Prisma.Decimal;
};

/** Pure totals calculation. total = subtotal + shipping − discount (clamped ≥ 0). */
export function computeOrderTotals(input: {
  subtotal: Prisma.Decimal.Value;
  shippingFee?: Prisma.Decimal.Value;
  discount?: Prisma.Decimal.Value;
}): OrderTotals {
  const subtotal = new Prisma.Decimal(input.subtotal);
  const shippingFee = new Prisma.Decimal(input.shippingFee ?? 0);
  const discount = new Prisma.Decimal(input.discount ?? 0);
  let total = subtotal.plus(shippingFee).minus(discount);
  if (total.isNegative()) total = new Prisma.Decimal(0);
  return { subtotal, shippingFee, discount, total };
}

/** Customers may cancel only while the order is still PENDING. */
export function canCancelOrder(status: OrderStatus): boolean {
  return status === "PENDING";
}

/** Human label for a payment method. */
export function paymentMethodLabel(method: string): string {
  return method === "SSLCOMMERZ" ? "Online Payment" : "Cash on Delivery";
}

export function formatOrderNumber(year: number, seq: number): string {
  return `ORD-${year}-${String(seq).padStart(6, "0")}`;
}

/** Forward status progression for the tracking timeline. */
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
];
