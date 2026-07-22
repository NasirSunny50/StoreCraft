import { NextResponse } from "next/server";
import {
  validateSslcommerzPayment,
  verifySslcommerzSignature,
  sslcommerzStorePassword,
  sslcommerzTransactionStatus,
} from "@/lib/sslcommerz";
import { markOrderPaid, failOrderPaymentByNumber } from "@/lib/orders";
import { notifyOrderPlaced, notifyOrderStatus } from "@/lib/notify-order";
import { orderResultUrl } from "@/lib/order-result";

/**
 * Heavy payment-finalization logic (validation, DB writes, notifications) —
 * kept out of the callback route's top-level imports and pulled in via dynamic
 * import ONLY on the finalize step. That way the first callback hit returns the
 * processing loader without paying the Prisma/module cold-start cost, so the
 * gateway's page is replaced by our loader as fast as possible.
 */

type Fields = Record<string, string>;

/** SUCCESS callback: re-validate via val_id, then mark paid (idempotent). */
export async function finalizeSuccess(fields: Fields, base: string): Promise<NextResponse> {
  const tranId = fields.tran_id ?? "";
  const valId = fields.val_id ?? "";
  try {
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

/**
 * FAIL / CANCEL callback: never trust the POST. First re-check whether the order
 * was in fact paid (late/duplicate callback) and mark it paid if so; otherwise
 * verify the callback signature and cancel the order, releasing reserved stock.
 */
export async function finalizeFailure(
  fields: Fields,
  base: string,
  outcome: "failed" | "cancelled",
): Promise<NextResponse> {
  const tranId = fields.tran_id ?? "";
  try {
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
    console.error(`[sslcommerz ${outcome}]`, e);
  }
  return NextResponse.redirect(await orderResultUrl(base, tranId, { payment: outcome }), 303);
}
