import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { orderPlacedEmail, orderStatusEmail } from "@/lib/email-templates";
import { siteUrl } from "@/lib/site-url";
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

    const { subject, html } = orderPlacedEmail({
      orderNumber: order.orderNumber,
      customerName: order.user.name,
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
      orderUrl: `${siteUrl()}/orders/${order.orderNumber}`,
    });
    await sendEmail({ to: order.user.email, subject, html });
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
      include: { user: { select: { name: true, email: true } } },
    });
    if (!order) return;

    const { subject, html } = orderStatusEmail({
      orderNumber: order.orderNumber,
      customerName: order.user.name,
      status,
      note,
      orderUrl: `${siteUrl()}/orders/${order.orderNumber}`,
    });
    await sendEmail({ to: order.user.email, subject, html });
  } catch (e) {
    console.error("[notifyOrderStatus failed]", e);
  }
}
