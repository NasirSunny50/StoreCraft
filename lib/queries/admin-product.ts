import { prisma } from "@/lib/prisma";

export async function getAdminProducts(opts: {
  q?: string;
  /** "active" → non-deleted catalog; "deleted" → only soft-deleted. */
  view?: "active" | "deleted";
  skip?: number;
  take?: number;
}) {
  const where = {
    isDeleted: opts.view === "deleted",
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

/** Count of soft-deleted products — used to surface the "deleted" filter. */
export async function getDeletedProductCount(): Promise<number> {
  return prisma.product.count({ where: { isDeleted: true } });
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
