import { NextResponse } from "next/server";
import { validateSslcommerzPayment } from "@/lib/sslcommerz";
import { markOrderPaid } from "@/lib/orders";
import { notifyOrderPlaced, notifyOrderStatus } from "@/lib/notify-order";
import { siteUrl } from "@/lib/site-url";

/**
 * SSLCommerz redirects the customer's browser here (POST) after payment. We
 * NEVER trust this POST — we re-validate the payment server-side via its
 * val_id, then mark the order paid (idempotent, amount-checked).
 */
export async function POST(req: Request) {
  const base = siteUrl();
  try {
    const form = await req.formData();
    const tranId = String(form.get("tran_id") ?? "");
    const valId = String(form.get("val_id") ?? "");
    if (!tranId || !valId) {
      return NextResponse.redirect(`${base}/orders?payment=error`, 303);
    }

    const v = await validateSslcommerzPayment(valId);
    if (!v.valid || v.tranId !== tranId) {
      return NextResponse.redirect(`${base}/orders/${tranId}?payment=failed`, 303);
    }

    const res = await markOrderPaid(tranId, v.amount);
    if (res.ok && res.newlyPaid) {
      await notifyOrderPlaced(res.orderId); // never throws
      if (res.confirmed) await notifyOrderStatus(res.orderId, "CONFIRMED");
    }
    if (!res.ok) {
      return NextResponse.redirect(`${base}/orders/${tranId}?payment=error`, 303);
    }
    return NextResponse.redirect(`${base}/orders/${tranId}?placed=1`, 303);
  } catch (e) {
    console.error("[sslcommerz success]", e);
    return NextResponse.redirect(`${base}/orders?payment=error`, 303);
  }
}
