"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { addressSchema } from "@/lib/validators/address";

export type AddressFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

export async function createAddressAction(
  _prev: AddressFormState,
  formData: FormData,
): Promise<AddressFormState> {
  const session = await requireAuth();
  const userId = session.user.id;

  const parsed = addressSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    line1: formData.get("line1"),
    line2: formData.get("line2"),
    city: formData.get("city"),
    area: formData.get("area"),
    postcode: formData.get("postcode"),
    isDefault: formData.get("isDefault") ? true : undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const count = await prisma.address.count({ where: { userId } });
  const makeDefault = parsed.data.isDefault || count === 0;

  await prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    await tx.address.create({
      data: {
        userId,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        line1: parsed.data.line1,
        line2: parsed.data.line2 ?? null,
        city: parsed.data.city,
        area: parsed.data.area ?? null,
        postcode: parsed.data.postcode ?? null,
        isDefault: makeDefault,
      },
    });
  });

  revalidatePath("/checkout");
  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function setDefaultAddressAction(addressId: string) {
  const session = await requireAuth();
  const userId = session.user.id;
  await prisma.$transaction(async (tx) => {
    const owned = await tx.address.findFirst({ where: { id: addressId, userId } });
    if (!owned) return;
    await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    await tx.address.update({ where: { id: addressId }, data: { isDefault: true } });
  });
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
}

export async function deleteAddressAction(
  addressId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireAuth();
  const userId = session.user.id;

  const usedByOrders = await prisma.order.count({ where: { addressId, userId } });
  if (usedByOrders > 0) {
    return { ok: false, error: "This address is used by past orders and can't be deleted." };
  }
  await prisma.address.deleteMany({ where: { id: addressId, userId } });
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { ok: true };
}
