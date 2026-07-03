"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-guard";
import {
  createOrderForUser,
  cancelOrder,
  failOrderPaymentByNumber,
  CheckoutError,
} from "@/lib/orders";
import { startSslcommerzPayment } from "@/lib/payment";
import { sslcommerzConfigured } from "@/lib/sslcommerz";
import { notifyOrderPlaced, notifyOrderStatus } from "@/lib/notify-order";
import { placeOrderSchema } from "@/lib/validators/checkout";

export type PlaceOrderState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  /** For online payment: the client redirects the browser to the gateway. */
  redirectUrl?: string;
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

  const online = parsed.data.paymentMethod === "SSLCOMMERZ";
  if (online && !sslcommerzConfigured()) {
    return { error: "Online payment is unavailable right now. Please choose Cash on Delivery." };
  }

  let order: { id: string; orderNumber: string };
  try {
    order = await createOrderForUser(session.user.id, {
      addressId: parsed.data.addressId,
      note: parsed.data.note,
      couponCode: parsed.data.couponCode,
      paymentMethod: parsed.data.paymentMethod,
    });
  } catch (e) {
    if (e instanceof CheckoutError) return { error: e.message };
    throw e;
  }

  // Online payment: open a gateway session and hand the URL to the client.
  // The confirmation email is sent only after payment is validated (callback).
  if (online) {
    try {
      const { gatewayUrl } = await startSslcommerzPayment(order.id);
      // NOTE: do NOT revalidate here — a layout refresh would re-render this
      // (now empty) cart's checkout page and unmount the component whose effect
      // performs the client redirect, cancelling it. The cart is cleared in the
      // DB already; the badge refreshes on the next server render (on return).
      return { redirectUrl: gatewayUrl };
    } catch {
      // Init failed — release the reserved stock so the customer can retry.
      await failOrderPaymentByNumber(order.orderNumber);
      return { error: "Could not start online payment. Please try again or choose Cash on Delivery." };
    }
  }

  // COD: confirm immediately.
  await notifyOrderPlaced(order.id); // never throws
  revalidatePath("/cart");
  revalidatePath("/orders");
  revalidatePath("/", "layout"); // cart badge
  redirect(`/orders/${order.orderNumber}?placed=1`);
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
  await notifyOrderStatus(orderId, "CANCELLED", "Cancelled by customer");
  revalidatePath("/orders");
  revalidatePath("/", "layout");
  return { ok: true };
}
