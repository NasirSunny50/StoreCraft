import { NextResponse } from "next/server";
import {
  verifySslcommerzSignature,
  sslcommerzStorePassword,
  sslcommerzTransactionStatus,
} from "@/lib/sslcommerz";
import { failOrderPaymentByNumber, markOrderPaid } from "@/lib/orders";
import { notifyOrderPlaced, notifyOrderStatus } from "@/lib/notify-order";
import { siteUrl } from "@/lib/site-url";

/**
 * Payment failed. We never trust this POST: first re-check server-side whether
 * the order was actually paid (a late/duplicated callback could arrive after a
 * real payment) — if so, mark it paid rather than cancelling. Otherwise, verify
 * the callback signature (so a forged POST can't cancel someone's order), then
 * release the reserved stock and cancel the order.
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
        return NextResponse.redirect(`${base}/orders/${tranId}?placed=1`, 303);
      }
      if (verifySslcommerzSignature(fields, sslcommerzStorePassword())) {
        await failOrderPaymentByNumber(tranId);
      }
    }
  } catch (e) {
    console.error("[sslcommerz fail]", e);
  }
  return NextResponse.redirect(`${base}/orders/${tranId}?payment=failed`, 303);
}
