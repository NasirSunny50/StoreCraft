import { validateSslcommerzPayment } from "@/lib/sslcommerz";
import { markOrderPaid } from "@/lib/orders";
import { notifyOrderPlaced } from "@/lib/notify-order";

/**
 * Server-to-server IPN — the reliable payment signal (fires even if the
 * customer closes the browser before the redirect). Validates via val_id and
 * marks the order paid, idempotently with the success callback.
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const tranId = String(form.get("tran_id") ?? "");
    const valId = String(form.get("val_id") ?? "");
    if (tranId && valId) {
      const v = await validateSslcommerzPayment(valId);
      if (v.valid && v.tranId === tranId) {
        const res = await markOrderPaid(tranId, v.amount);
        if (res.ok && res.newlyPaid) await notifyOrderPlaced(res.orderId);
      }
    }
  } catch (e) {
    console.error("[sslcommerz ipn]", e);
  }
  // Always 200 so SSLCommerz doesn't retry a processed notification forever.
  return new Response("IPN received", { status: 200 });
}
