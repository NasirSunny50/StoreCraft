"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { couponSchema, type CouponInput } from "@/lib/validators/coupon";

export type CouponActionResult =
  | { ok: true; id: string }
  | { ok: false; error?: string; fieldErrors?: Record<string, string[]> };

function toData(d: CouponInput) {
  return {
    code: d.code,
    type: d.type,
    value: new Prisma.Decimal(d.value),
    minOrder: new Prisma.Decimal(d.minOrder),
    usageLimit: d.usageLimit ?? null,
    expiresAt: d.expiresAt ?? null,
    isActive: d.isActive,
  };
}

export async function createCoupon(input: unknown): Promise<CouponActionResult> {
  await requireAdmin();
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const exists = await prisma.coupon.findUnique({ where: { code: parsed.data.code } });
  if (exists) return { ok: false, error: "A coupon with this code already exists." };

  const coupon = await prisma.coupon.create({ data: toData(parsed.data) });
  revalidatePath("/admin/coupons");
  return { ok: true, id: coupon.id };
}

export async function updateCoupon(id: string, input: unknown): Promise<CouponActionResult> {
  await requireAdmin();
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const clash = await prisma.coupon.findFirst({
    where: { code: parsed.data.code, id: { not: id } },
  });
  if (clash) return { ok: false, error: "A coupon with this code already exists." };

  await prisma.coupon.update({ where: { id }, data: toData(parsed.data) });
  revalidatePath("/admin/coupons");
  return { ok: true, id };
}

export async function toggleCoupon(id: string, isActive: boolean): Promise<{ ok: boolean }> {
  await requireAdmin();
  await prisma.coupon.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/coupons");
  return { ok: true };
}

export async function deleteCoupon(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const used = await prisma.order.count({ where: { couponId: id } });
  if (used > 0) {
    return { ok: false, error: "Coupon is used by orders. Deactivate it instead." };
  }
  await prisma.coupon.delete({ where: { id } });
  revalidatePath("/admin/coupons");
  return { ok: true };
}
