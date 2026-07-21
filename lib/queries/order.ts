import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const orderInclude = {
  items: true,
  address: true,
  statusLogs: { orderBy: { createdAt: "asc" as const } },
} satisfies Prisma.OrderInclude;

export type OrderWithDetails = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;

export type OrderPage = {
  items: OrderWithDetails[];
  nextCursor: string | null;
};

/** Cursor-paginated order history for a user (newest first). */
export async function getUserOrders(
  userId: string,
  cursor?: string,
  take = 10,
): Promise<OrderPage> {
  const rows = await prisma.order.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: orderInclude,
  });
  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1]!.id : null };
}

/** Offset-paginated order history for a user (newest first) — for numbered pages. */
export async function getUserOrdersPage(
  userId: string,
  opts: { skip?: number; take?: number } = {},
): Promise<{ items: OrderWithDetails[]; total: number }> {
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: opts.skip,
      take: opts.take,
      include: orderInclude,
    }),
    prisma.order.count({ where: { userId } }),
  ]);
  return { items, total };
}

/** Fetch one order by its human number, scoped to the owner. */
export async function getOrderByNumberForUser(
  userId: string,
  orderNumber: string,
): Promise<OrderWithDetails | null> {
  return prisma.order.findFirst({
    where: { orderNumber, userId },
    include: orderInclude,
  });
}

/** Digits-only, for lenient phone comparison (ignores spaces, +88, dashes). */
function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

/**
 * Public order lookup for the Track Order page: match by order number AND the
 * delivery phone, so no login is needed but a bare order number alone can't
 * reveal someone else's order. Phone compared on trailing digits (handles
 * +880 / leading-zero variants).
 */
export async function getOrderForTracking(
  orderNumber: string,
  phone: string,
): Promise<OrderWithDetails | null> {
  const order = await prisma.order.findUnique({
    where: { orderNumber: orderNumber.trim() },
    include: orderInclude,
  });
  if (!order) return null;

  const input = digitsOnly(phone);
  const stored = digitsOnly(order.address.phone);
  if (input.length < 6 || stored.length < 6) return null;
  const match = stored.endsWith(input) || input.endsWith(stored);
  return match ? order : null;
}
