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
