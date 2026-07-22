import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/site-url";
import {
  paymentProcessingResponse,
  FINALIZE_STEP,
  FINALIZE_VALUE,
} from "@/lib/payment/processing-page";

const SUCCESS_PATH = "/api/payment/sslcommerz/success";

/**
 * SSLCommerz redirects the customer's browser here (POST) after payment. We
 * NEVER trust this POST — the finalize step re-validates via val_id, then marks
 * the order paid (idempotent, amount-checked).
 *
 * Two-step: the gateway's first POST returns our animated processing page fast
 * (no heavy imports), which re-posts with a finalize marker. The heavy
 * validation module is only dynamically imported on that finalize step, so the
 * loader replaces the gateway screen without the Prisma cold-start delay.
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

    // Step 1 — show the loader immediately; it auto-posts back here to finalize.
    if (fields[FINALIZE_STEP] !== FINALIZE_VALUE) {
      return paymentProcessingResponse({
        actionUrl: SUCCESS_PATH,
        fields: { ...fields, [FINALIZE_STEP]: FINALIZE_VALUE },
        title: "Confirming your payment",
        subtitle: "Please wait while we securely confirm your payment and finalize your order.",
      });
    }

    // Step 2 — finalize (heavy logic loaded only now).
    const { finalizeSuccess } = await import("@/lib/payment/finalize");
    return finalizeSuccess(fields, base);
  } catch (e) {
    console.error("[sslcommerz success]", e);
    return NextResponse.redirect(`${base}/orders?payment=error`, 303);
  }
}
