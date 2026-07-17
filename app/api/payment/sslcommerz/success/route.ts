import { NextResponse } from "next/server";
import { validateSslcommerzPayment } from "@/lib/sslcommerz";
import { markOrderPaid } from "@/lib/orders";
import { notifyOrderPlaced, notifyOrderStatus } from "@/lib/notify-order";
import { orderResultUrl } from "@/lib/order-result";
import { siteUrl } from "@/lib/site-url";
import {
  paymentProcessingResponse,
  FINALIZE_STEP,
  FINALIZE_VALUE,
} from "@/lib/payment/processing-page";

const SUCCESS_PATH = "/api/payment/sslcommerz/success";

/**
 * SSLCommerz redirects the customer's browser here (POST) after payment. We
 * NEVER trust this POST — we re-validate the payment server-side via its
 * val_id, then mark the order paid (idempotent, amount-checked).
 *
 * Two-step: the gateway's first POST renders our animated processing page,
 * which re-posts the same fields with a finalize marker so the (slower)
 * server-side validation runs with our loader on screen instead of a blank tab.
 */
export async function POST(req: Request) {
  const base = siteUrl();
  try {
    const form = await req.formData();
    const fields: Record<string, string> = {};
    for (const [k, v] of form.entries()) fields[k] = String(v);
    const tranId = fields.tran_id ?? "";
    const valId = fields.val_id ?? "";
    if (!tranId || !valId) {
      return NextResponse.redirect(`${base}/orders?payment=error`, 303);
    }

    // Step 1 — show the loader, which auto-submits back here to finalize.
    if (fields[FINALIZE_STEP] !== FINALIZE_VALUE) {
      return paymentProcessingResponse({
        actionUrl: SUCCESS_PATH,
        fields: { ...fields, [FINALIZE_STEP]: FINALIZE_VALUE },
        title: "Confirming your payment",
        subtitle: "Please wait while we securely confirm your payment and finalize your order.",
      });
    }

    // Step 2 — finalize (authoritative server-side validation).
    const v = await validateSslcommerzPayment(valId);
    if (!v.valid || v.tranId !== tranId) {
      return NextResponse.redirect(await orderResultUrl(base, tranId, { payment: "failed" }), 303);
    }

    const res = await markOrderPaid(tranId, v.amount);
    if (res.ok && res.newlyPaid) {
      await notifyOrderPlaced(res.orderId); // never throws
      if (res.confirmed) await notifyOrderStatus(res.orderId, "CONFIRMED");
    }
    if (!res.ok) {
      return NextResponse.redirect(await orderResultUrl(base, tranId, { payment: "error" }), 303);
    }
    return NextResponse.redirect(await orderResultUrl(base, tranId, { placed: "1" }), 303);
  } catch (e) {
    console.error("[sslcommerz success]", e);
    return NextResponse.redirect(`${base}/orders?payment=error`, 303);
  }
}
