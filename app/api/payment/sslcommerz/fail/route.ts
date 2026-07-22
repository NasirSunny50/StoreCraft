import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/site-url";
import {
  paymentProcessingResponse,
  FINALIZE_STEP,
  FINALIZE_VALUE,
} from "@/lib/payment/processing-page";

const FAIL_PATH = "/api/payment/sslcommerz/fail";

/**
 * Payment failed. The first POST returns our loader fast (no heavy imports);
 * the finalize step (dynamically imported) re-checks whether the order was in
 * fact paid, else verifies the signature and cancels it.
 */
export async function POST(req: Request) {
  const base = siteUrl();
  try {
    const form = await req.formData();
    const fields: Record<string, string> = {};
    for (const [k, v] of form.entries()) fields[k] = String(v);

    // Step 1 — show the loader immediately; it auto-posts back here to finalize.
    if (fields[FINALIZE_STEP] !== FINALIZE_VALUE) {
      return paymentProcessingResponse({
        actionUrl: FAIL_PATH,
        fields: { ...fields, [FINALIZE_STEP]: FINALIZE_VALUE },
        title: "Finalizing your order",
        subtitle: "One moment while we check your payment status.",
      });
    }

    // Step 2 — finalize (heavy logic loaded only now).
    const { finalizeFailure } = await import("@/lib/payment/finalize");
    return finalizeFailure(fields, base, "failed");
  } catch (e) {
    console.error("[sslcommerz fail]", e);
    return NextResponse.redirect(`${base}/orders?payment=failed`, 303);
  }
}
