import { Prisma } from "@prisma/client";
import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getDashboardStats(sinceDays: number | null) {
  const since = sinceDays ? new Date(Date.now() - sinceDays * 86_400_000) : null;
  const revenueWhere: Prisma.OrderWhereInput = {
    status: { not: "CANCELLED" },
    ...(since ? { createdAt: { gte: since } } : {}),
  };

  const [revenueAgg, orderCount, customerCount, products, byStatus, topItems] =
    await Promise.all([
      prisma.order.aggregate({ _sum: { total: true }, where: revenueWhere }),
      prisma.order.count({ where: revenueWhere }),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.product.findMany({
        where: { isDeleted: false },
        select: { stock: true, lowStockAt: true },
      }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        where: { order: { status: { not: "CANCELLED" } } },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

  const lowStock = products.filter((p) => p.stock <= p.lowStockAt).length;

  const topIds = topItems.map((t) => t.productId);
  const topProducts = topIds.length
    ? await prisma.product.findMany({
        where: { id: { in: topIds } },
        select: { id: true, name: true },
      })
    : [];
  const nameById = new Map(topProducts.map((p) => [p.id, p.name]));

  return {
    revenue: revenueAgg._sum.total ?? new Prisma.Decimal(0),
    orderCount,
    customerCount,
    lowStock,
    byStatus: byStatus.map((s) => ({
      status: s.status as OrderStatus,
      count: s._count._all,
    })),
    top: topItems.map((t) => ({
      name: nameById.get(t.productId) ?? "—",
      qty: t._sum.quantity ?? 0,
    })),
  };
}

export async function getSalesReport(
  from?: Date,
  to?: Date,
  opts: { status?: OrderStatus; orderNumber?: string; customer?: string } = {},
) {
  const { status, orderNumber, customer } = opts;
  const createdAt: Prisma.DateTimeFilter = {};
  if (from) createdAt.gte = from;
  if (to) createdAt.lte = to;

  const orders = await prisma.order.findMany({
    where: {
      // A specific status filter overrides the default "everything but cancelled".
      status: status ?? { not: "CANCELLED" },
      ...(from || to ? { createdAt } : {}),
      ...(orderNumber ? { orderNumber: { contains: orderNumber, mode: "insensitive" } } : {}),
      // Match customer across account name/email, guest name, and guest email.
      ...(customer
        ? {
            OR: [
              { user: { name: { contains: customer, mode: "insensitive" } } },
              { user: { email: { contains: customer, mode: "insensitive" } } },
              { address: { fullName: { contains: customer, mode: "insensitive" } } },
              { guestEmail: { contains: customer, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      // Guest orders have no user — fall back to the shipping address.
      address: { select: { fullName: true } },
    },
  });

  const total = orders.reduce(
    (acc, o) => acc.plus(o.total),
    new Prisma.Decimal(0),
  );
  return { orders, total, count: orders.length };
}
