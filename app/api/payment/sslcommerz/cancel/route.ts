import { NextResponse } from "next/server";
import {
  verifySslcommerzSignature,
  sslcommerzStorePassword,
  sslcommerzTransactionStatus,
} from "@/lib/sslcommerz";
import { failOrderPaymentByNumber, markOrderPaid } from "@/lib/orders";
import { notifyOrderPlaced, notifyOrderStatus } from "@/lib/notify-order";
import { orderResultUrl } from "@/lib/order-result";
import { siteUrl } from "@/lib/site-url";

/**
 * Customer cancelled on the gateway. As with the fail callback, never trust the
 * POST: re-check server-side whether the order was in fact paid (and mark it
 * paid if so); otherwise verify the signature, then release the reserved stock
 * and cancel the order so it doesn't linger as pending.
 */
export async function POST(req: Request) {
  const base = siteUrl();
  let tranId = "";
  try {
    const form = await req.formData();
    const fields: Record<string, string> = {};
    for (const [k, v] of form.entries()) fields[k] = String(v);
    tranId = fields.tran_id ?? "";

    if (tranId) {
      const tx = await sslcommerzTransactionStatus(tranId);
      if (tx.paid) {
        const res = await markOrderPaid(tranId, tx.amount);
        if (res.ok && res.newlyPaid) {
          await notifyOrderPlaced(res.orderId);
          if (res.confirmed) await notifyOrderStatus(res.orderId, "CONFIRMED");
        }
        return NextResponse.redirect(await orderResultUrl(base, tranId, { placed: "1" }), 303);
      }
      if (verifySslcommerzSignature(fields, sslcommerzStorePassword())) {
        await failOrderPaymentByNumber(tranId);
      }
    }
  } catch (e) {
    console.error("[sslcommerz cancel]", e);
  }
  return NextResponse.redirect(await orderResultUrl(base, tranId, { payment: "cancelled" }), 303);
}
