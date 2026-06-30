import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ---------- Inventory ----------
export async function getInventory(lowOnly: boolean) {
  const rows = await prisma.product.findMany({
    where: { isDeleted: false },
    orderBy: { stock: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      stock: true,
      lowStockAt: true,
      category: { select: { name: true } },
    },
    take: 300,
  });
  return lowOnly ? rows.filter((p) => p.stock <= p.lowStockAt) : rows;
}

export async function getRecentStockLogs(take = 30) {
  return prisma.stockLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: { product: { select: { name: true } } },
  });
}

// ---------- Orders ----------
export async function getAdminOrders(status?: OrderStatus) {
  return prisma.order.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { items: true } },
    },
  });
}

export async function getAdminOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      address: true,
      user: { select: { name: true, email: true } },
      statusLogs: { orderBy: { createdAt: "asc" } },
    },
  });
}

// ---------- Customers ----------
export async function getCustomers(q?: string) {
  return prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(q
        ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      isBlocked: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
  });
}

export async function getCustomer(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
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
