import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site-url";
import { initiateSslcommerzSession } from "@/lib/sslcommerz";

const CALLBACK_BASE = "/api/payment/sslcommerz";

/** Load an order and open an SSLCommerz session; returns the gateway URL. */
export async function startSslcommerzPayment(orderId: string): Promise<{ gatewayUrl: string }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, address: true, items: true },
  });
  if (!order) throw new Error("Order not found for payment.");

  const base = siteUrl();
  const productName =
    order.items.map((i) => i.name).join(", ").slice(0, 250) || "StoreCraft order";

  return initiateSslcommerzSession({
    orderNumber: order.orderNumber,
    amount: order.total.toFixed(2),
    customer: {
      name: order.address.fullName,
      email: order.user.email,
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
