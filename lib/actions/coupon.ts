"use server";

import { prisma } from "@/lib/prisma";
import { getCart, cartSubtotal } from "@/lib/cart";
import { validateCoupon } from "@/lib/coupon-math";
import { computeOrderTotals } from "@/lib/order-math";
import { getShippingFee } from "@/lib/settings";
import { formatBDT } from "@/lib/utils/money";

export type CouponPreview =
  | { ok: true; code: string; discount: string; total: string }
  | { ok: false; error: string };

/** Validate a coupon against the current cart for live checkout display. */
export async function previewCoupon(code: string): Promise<CouponPreview> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return { ok: false, error: "Enter a coupon code." };

  const cart = await getCart();
  const subtotal = cartSubtotal(cart);
  if (subtotal.lessThanOrEqualTo(0)) return { ok: false, error: "Your cart is empty." };

  const coupon = await prisma.coupon.findUnique({ where: { code: trimmed } });
  if (!coupon) return { ok: false, error: "Invalid coupon code." };

  const check = validateCoupon(coupon, subtotal);
  if (!check.valid) return { ok: false, error: check.reason };

  const totals = computeOrderTotals({
    subtotal,
    shippingFee: await getShippingFee(),
    discount: check.discount,
  });
  return {
    ok: true,
    code: coupon.code,
    discount: formatBDT(check.discount),
    total: formatBDT(totals.total),
  };
}
