import { prisma } from "@/lib/prisma";

/**
 * Build the post-payment redirect URL for an order. Logged-in orders go to the
 * account order page; guest orders (no user) go to the public /track page,
 * pre-filled with the order number and delivery phone. Query params (e.g.
 * `placed=1`, `payment=failed`) are carried through to either destination.
 */
export async function orderResultUrl(
  base: string,
  orderNumber: string,
  query: Record<string, string> = {},
): Promise<string> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: { userId: true, address: { select: { phone: true } } },
  });

  const qs = new URLSearchParams(query);

  // Unknown order or guest order → public tracking page.
  if (!order || !order.userId) {
    qs.set("order", orderNumber);
    if (order) qs.set("phone", order.address.phone);
    return `${base}/track?${qs.toString()}`;
  }

  const suffix = qs.toString();
  return `${base}/orders/${encodeURIComponent(orderNumber)}${suffix ? `?${suffix}` : ""}`;
}
