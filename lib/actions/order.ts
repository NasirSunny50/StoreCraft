"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-guard";
import { createOrderForUser, cancelOrder, CheckoutError } from "@/lib/orders";
import { placeOrderSchema } from "@/lib/validators/checkout";

export type PlaceOrderState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

export async function placeOrderAction(
  _prev: PlaceOrderState,
  formData: FormData,
): Promise<PlaceOrderState> {
  const session = await requireAuth();

  const parsed = placeOrderSchema.safeParse({
    addressId: formData.get("addressId"),
    paymentMethod: formData.get("paymentMethod") ?? "COD",
    note: formData.get("note"),
    couponCode: formData.get("couponCode"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let orderNumber: string;
  try {
    const order = await createOrderForUser(session.user.id, {
      addressId: parsed.data.addressId,
      note: parsed.data.note,
      couponCode: parsed.data.couponCode,
    });
    orderNumber = order.orderNumber;
  } catch (e) {
    if (e instanceof CheckoutError) return { error: e.message };
    throw e;
  }

  revalidatePath("/cart");
  revalidatePath("/orders");
  revalidatePath("/", "layout"); // cart badge
  redirect(`/orders/${orderNumber}?placed=1`);
}

export async function cancelOrderAction(
  orderId: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireAuth();
  try {
    await cancelOrder(session.user.id, orderId);
  } catch (e) {
    if (e instanceof CheckoutError) return { ok: false, error: e.message };
    throw e;
  }
  revalidatePath("/orders");
  revalidatePath("/", "layout");
  return { ok: true };
}
