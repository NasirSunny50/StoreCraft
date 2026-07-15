import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ---------- Inventory ----------
export async function getInventory(lowOnly: boolean, q?: string) {
  const rows = await prisma.product.findMany({
    where: {
      isDeleted: false,
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { stock: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      stock: true,
      lowStockAt: true,
      costPrice: true,
      category: { select: { name: true } },
    },
    take: 300,
  });
  return lowOnly ? rows.filter((p) => p.stock <= p.lowStockAt) : rows;
}

/** Cost-change history for one product (restocks + manual edits), newest first. */
export async function getProductCostHistory(productId: string, take = 50) {
  return prisma.stockLog.findMany({
    where: { productId, costAfter: { not: null } },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getStockLogs(opts: { skip?: number; take?: number } = {}) {
  const [items, total] = await Promise.all([
    prisma.stockLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: opts.skip,
      take: opts.take,
      include: { product: { select: { name: true } } },
    }),
    prisma.stockLog.count(),
  ]);
  return { items, total };
}

// ---------- Orders ----------
export async function getAdminOrders(opts: {
  status?: OrderStatus;
  skip?: number;
  take?: number;
}) {
  const where = opts.status ? { status: opts.status } : {};
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: opts.skip,
      take: opts.take,
      include: {
        user: { select: { name: true, email: true, phone: true } },
        // Guest orders have no user — fall back to the shipping address.
        address: { select: { fullName: true, phone: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);
  return { items, total };
}

export async function getAdminOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      address: true,
      user: { select: { name: true, email: true, phone: true } },
      statusLogs: { orderBy: { createdAt: "asc" } },
    },
  });
}

// ---------- Customers ----------
export async function getCustomers(opts: { q?: string; skip?: number; take?: number }) {
  const where = {
    role: "CUSTOMER" as const,
    ...(opts.q
      ? {
          OR: [
            { name: { contains: opts.q, mode: "insensitive" as const } },
            { email: { contains: opts.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: opts.skip,
      take: opts.take,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isBlocked: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total };
}

export async function getCustomer(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isBlocked: true,
      createdAt: true,
      orders: {
        orderBy: { createdAt: "desc" },
        select: { id: true, orderNumber: true, total: true, status: true, createdAt: true },
      },
    },
  });
}
