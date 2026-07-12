import { prisma } from "@/lib/prisma";

/** Max products that can be compared side by side. */
export const MAX_COMPARE = 4;

/**
 * Fetch active products for the comparison table, preserving the order of the
 * requested id list. Silently drops ids that don't resolve to a live product.
 */
export async function getProductsForCompare(ids: string[]) {
  const unique = [...new Set(ids)].slice(0, MAX_COMPARE);
  if (unique.length === 0) return [];

  const rows = await prisma.product.findMany({
    where: { id: { in: unique }, isActive: true, isDeleted: false },
    include: {
      brand: { select: { name: true } },
      category: { select: { name: true } },
      images: { orderBy: { position: "asc" }, take: 1 },
      specs: { orderBy: { key: "asc" } },
    },
  });

  // Keep the caller's ordering (findMany doesn't guarantee it).
  const byId = new Map(rows.map((r) => [r.id, r]));
  return unique.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => !!p);
}

export type CompareProduct = Awaited<ReturnType<typeof getProductsForCompare>>[number];
