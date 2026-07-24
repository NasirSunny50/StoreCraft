import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/site-url";
import { finalizeFailure } from "@/lib/payment/finalize";

/**
 * Customer cancelled on the gateway. As with the fail callback, never trust the
 * POST: finalize re-checks whether the order was in fact paid (and marks it paid
 * if so), else verifies the signature and cancels it.
 */
export async function POST(req: Request) {
  const base = siteUrl();
  try {
    const form = await req.formData();
    const fields: Record<string, string> = {};
    for (const [k, v] of form.entries()) fields[k] = String(v);
    return finalizeFailure(fields, base, "cancelled");
  } catch (e) {
    console.error("[sslcommerz cancel]", e);
    return NextResponse.redirect(`${base}/orders?payment=cancelled`, 303);
  }
}
