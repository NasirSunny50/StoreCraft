import { prisma } from "@/lib/prisma";

export async function getAdminProducts(opts: {
  q?: string;
  includeDeleted?: boolean;
  skip?: number;
  take?: number;
}) {
  const where = {
    ...(opts.includeDeleted ? {} : { isDeleted: false }),
    ...(opts.q ? { name: { contains: opts.q, mode: "insensitive" as const } } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
      },
      skip: opts.skip,
      take: opts.take,
    }),
    prisma.product.count({ where }),
  ]);
  return { items, total };
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
