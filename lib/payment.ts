import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site-url";
import { initiateSslcommerzSession } from "@/lib/sslcommerz";
import type { Prisma } from "@prisma/client";

const CALLBACK_BASE = "/api/payment/sslcommerz";

type OrderForPayment = Prisma.OrderGetPayload<{
  include: { user: true; address: true; items: true };
}>;

/** Open an SSLCommerz session for a loaded order; returns the gateway URL. */
function initiateForOrder(order: OrderForPayment): Promise<{ gatewayUrl: string }> {
  const base = siteUrl();
  const productName =
    order.items.map((i) => i.name).join(", ").slice(0, 250) || "StoreCraft order";

  return initiateSslcommerzSession({
    orderNumber: order.orderNumber,
    amount: order.total.toFixed(2),
    customer: {
      name: order.address.fullName,
      // SSLCommerz requires an email; fall back when the customer has none.
      email: order.user.email ?? "noreply@storecraft.app",
      phone: order.address.phone,
      address: order.address.line1,
      city: order.address.city,
    },
    productName,
    numItems: order.items.length,
    successUrl: `${base}${CALLBACK_BASE}/success`,
    failUrl: `${base}${CALLBACK_BASE}/fail`,
    cancelUrl: `${base}${CALLBACK_BASE}/cancel`,
    ipnUrl: `${base}${CALLBACK_BASE}/ipn`,
  });
}

/** Load an order and open an SSLCommerz session; returns the gateway URL. */
export async function startSslcommerzPayment(orderId: string): Promise<{ gatewayUrl: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, address: true, items: true },
  });
  if (!order) throw new Error("Order not found for payment.");
  return initiateForOrder(order);
}

/** Retry failure for a payment that can't be re-initiated (bad state / owner mismatch). */
export class RetryPaymentError extends Error {}

/**
 * Re-open a gateway session for an EXISTING online order the customer already
 * placed (e.g. after a failed/cancelled attempt). Scoped to the owner and only
 * allowed while the order is still an unpaid, non-cancelled SSLCommerz order.
 * The order + its reserved stock already exist, so this does not touch the cart.
 */
export async function retryOnlinePaymentForUser(
  userId: string,
  orderId: string,
): Promise<{ gatewayUrl: string }> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { user: true, address: true, items: true },
  });
  if (!order) throw new RetryPaymentError("Order not found.");
  if (order.paymentMethod !== "SSLCOMMERZ") {
    throw new RetryPaymentError("This order is not an online-payment order.");
  }
  if (order.paymentStatus === "PAID") {
    throw new RetryPaymentError("This order has already been paid.");
  }
  if (order.status === "CANCELLED") {
    throw new RetryPaymentError("This order was cancelled.");
  }
  return initiateForOrder(order);
}
