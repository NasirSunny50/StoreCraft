import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/site-url";
import { finalizeSuccess } from "@/lib/payment/finalize";

/**
 * SSLCommerz redirects the customer's browser here (POST) after payment. We
 * NEVER trust this POST — we re-validate via val_id, then mark the order paid
 * (idempotent, amount-checked) and redirect to the order result.
 */
export async function POST(req: Request) {
  const base = siteUrl();
  try {
    const form = await req.formData();
    const fields: Record<string, string> = {};
    for (const [k, v] of form.entries()) fields[k] = String(v);
    if (!fields.tran_id || !fields.val_id) {
      return NextResponse.redirect(`${base}/orders?payment=error`, 303);
    }
    return finalizeSuccess(fields, base);
  } catch (e) {
    console.error("[sslcommerz success]", e);
    return NextResponse.redirect(`${base}/orders?payment=error`, 303);
  }
}
