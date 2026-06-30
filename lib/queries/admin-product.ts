import { prisma } from "@/lib/prisma";

export async function getAdminProducts(opts: { q?: string; includeDeleted?: boolean }) {
  return prisma.product.findMany({
    where: {
      ...(opts.includeDeleted ? {} : { isDeleted: false }),
      ...(opts.q ? { name: { contains: opts.q, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true } },
      brand: { select: { name: true } },
    },
    take: 100,
  });
}

export async function getAdminProduct(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      specs: { orderBy: { key: "asc" } },
      images: { orderBy: { position: "asc" } },
    },
  });
}
