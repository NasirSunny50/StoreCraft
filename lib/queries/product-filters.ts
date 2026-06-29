import type { Prisma } from "@prisma/client";
import type { ProductFilter, ProductSort } from "@/lib/validators/product";

/** Pure Prisma `where` builder for product listings. Unit-testable (no DB). */
export function buildProductWhere(f: ProductFilter): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    isDeleted: false,
  };

  if (f.category) where.category = { slug: f.category };
  if (f.brand) where.brand = { slug: f.brand };

  if (f.minPrice !== undefined || f.maxPrice !== undefined) {
    where.price = {};
    if (f.minPrice !== undefined) where.price.gte = f.minPrice;
    if (f.maxPrice !== undefined) where.price.lte = f.maxPrice;
  }

  if (f.inStock) where.stock = { gt: 0 };

  if (f.minRating !== undefined && f.minRating > 0) {
    where.ratingAvg = { gte: f.minRating };
  }

  if (f.q) {
    where.OR = [
      { name: { contains: f.q, mode: "insensitive" } },
      { description: { contains: f.q, mode: "insensitive" } },
    ];
  }

  return where;
}

/**
 * Pure orderBy builder. Always ends with a unique `id` tiebreaker so that
 * cursor pagination is stable even when the primary sort key has ties.
 */
export function buildProductOrderBy(
  sort: ProductSort,
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price-asc":
      return [{ price: "asc" }, { id: "asc" }];
    case "price-desc":
      return [{ price: "desc" }, { id: "desc" }];
    case "popularity":
      return [{ ratingCount: "desc" }, { ratingAvg: "desc" }, { id: "desc" }];
    case "newest":
    default:
      return [{ createdAt: "desc" }, { id: "desc" }];
  }
}
