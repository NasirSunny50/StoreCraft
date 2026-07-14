import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { orderPlacedEmail, orderStatusEmail } from "@/lib/email-templates";
import { siteUrl } from "@/lib/site-url";
import { getBranding } from "@/lib/branding";
import { formatBDT, multiply } from "@/lib/utils/money";

/**
 * Order email notifications. Called AFTER the order transaction commits and
 * never throw — a notification failure must not break the order flow.
 */

export async function notifyOrderPlaced(orderId: string): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true } },
        items: true,
        address: true,
      },
    });
    if (!order) return;
    // Email may come from the account (user) or a guest-checkout email. None on
    // file → the customer opted out of email updates. Nothing to send.
    const userEmail = order.user?.email ?? order.guestEmail;
    if (!userEmail) return;
    // Guests have no /orders page — point their links at public tracking.
    const orderUrl = order.userId
      ? `${siteUrl()}/orders/${order.orderNumber}`
      : `${siteUrl()}/track?order=${encodeURIComponent(order.orderNumber)}`;

    const branding = await getBranding();
    const { subject, html } = orderPlacedEmail({
      brand: { shopName: branding.shopName, hotline: branding.hotline },
      orderNumber: order.orderNumber,
      customerName: order.user?.name ?? order.address.fullName,
      items: order.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        color: i.color,
        lineTotal: formatBDT(multiply(i.price, i.quantity)),
      })),
      subtotal: formatBDT(order.subtotal),
      shippingFee: formatBDT(order.shippingFee),
      discount: order.discount.greaterThan(0) ? formatBDT(order.discount) : null,
      total: formatBDT(order.total),
      addressLines: [
        `${order.address.fullName} · ${order.address.phone}`,
        [order.address.line1, order.address.line2, order.address.area, order.address.city, order.address.postcode]
          .filter(Boolean)
          .join(", "),
      ],
      orderUrl,
      paid: order.paymentStatus === "PAID",
    });
    await sendEmail({ to: userEmail, subject, html });
  } catch (e) {
    console.error("[notifyOrderPlaced failed]", e);
  }
}

export async function notifyOrderStatus(
  orderId: string,
  status: OrderStatus,
  note?: string | null,
): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { name: true, email: true } },
        address: { select: { fullName: true } },
      },
    });
    if (!order) return;
    const userEmail = order.user?.email ?? order.guestEmail;
    if (!userEmail) return;
    const orderUrl = order.userId
      ? `${siteUrl()}/orders/${order.orderNumber}`
      : `${siteUrl()}/track?order=${encodeURIComponent(order.orderNumber)}`;

    const branding = await getBranding();
    const { subject, html } = orderStatusEmail({
      brand: { shopName: branding.shopName, hotline: branding.hotline },
      orderNumber: order.orderNumber,
      customerName: order.user?.name ?? order.address.fullName,
      status,
      note,
      orderUrl,
      trackingCarrier: order.trackingCarrier,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
    });
    await sendEmail({ to: userEmail, subject, html });
  } catch (e) {
    console.error("[notifyOrderStatus failed]", e);
  }
}
