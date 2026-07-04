import { NextResponse } from "next/server";
import { verifySslcommerzSignature, sslcommerzStorePassword } from "@/lib/sslcommerz";
import { failOrderPaymentByNumber } from "@/lib/orders";
import { siteUrl } from "@/lib/site-url";

/**
 * Customer cancelled on the gateway. Verify the signature, then release the
 * reserved stock and cancel the order so it doesn't linger as pending.
 */
export async function POST(req: Request) {
  const base = siteUrl();
  let tranId = "";
  try {
    const form = await req.formData();
    const fields: Record<string, string> = {};
    for (const [k, v] of form.entries()) fields[k] = String(v);
    tranId = fields.tran_id ?? "";

    const storePasswd = sslcommerzStorePassword();
    if (tranId && verifySslcommerzSignature(fields, storePasswd)) {
      await failOrderPaymentByNumber(tranId);
    }
  } catch (e) {
    console.error("[sslcommerz cancel]", e);
  }
  return NextResponse.redirect(`${base}/orders/${tranId}?payment=cancelled`, 303);
}
