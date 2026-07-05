"use server";

import { prisma } from "@/lib/prisma";
import { getCart, cartSubtotal } from "@/lib/cart";
import { validateCoupon } from "@/lib/coupon-math";
import { formatBDT } from "@/lib/utils/money";

export type CouponPreview =
  | { ok: true; code: string; discount: string; discountValue: string }
  | { ok: false; error: string };

/**
 * Validate a coupon against the current cart for live checkout display. Returns
 * the discount only — the total is computed on the client since the delivery
 * charge now depends on the selected address's city.
 */
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

  return {
    ok: true,
    code: coupon.code,
    discount: formatBDT(check.discount),
    discountValue: check.discount.toString(),
  };
}
