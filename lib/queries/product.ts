import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PRODUCTS_PER_PAGE, type ProductFilter } from "@/lib/validators/product";
import {
  buildProductWhere,
  buildProductOrderBy,
} from "@/lib/queries/product-filters";

const listInclude = {
  brand: { select: { name: true, slug: true } },
  category: { select: { name: true, slug: true } },
  images: { orderBy: { position: "asc" as const }, take: 1 },
  specs: { orderBy: { key: "asc" as const }, take: 4 },
} satisfies Prisma.ProductInclude;

export type ProductListItem = Prisma.ProductGetPayload<{
  include: typeof listInclude;
}>;

export type ProductPage = {
  items: ProductListItem[];
  nextCursor: string | null;
};

/** Cursor-paginated product listing with filters + sort. */
export async function getProducts(
  filter: ProductFilter,
  take: number = PRODUCTS_PER_PAGE,
): Promise<ProductPage> {
  const where = buildProductWhere(filter);
  const orderBy = buildProductOrderBy(filter.sort);

  const rows = await prisma.product.findMany({
    where,
    orderBy,
    take: take + 1, // fetch one extra to detect another page
    ...(filter.cursor
      ? { cursor: { id: filter.cursor }, skip: 1 }
      : {}),
    include: listInclude,
  });

  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;
  const nextCursor = hasMore ? items[items.length - 1]!.id : null;
  return { items, nextCursor };
}

export async function getProductCount(filter: ProductFilter): Promise<number> {
  return prisma.product.count({ where: buildProductWhere(filter) });
}

export async function getFeaturedProducts(take = 4): Promise<ProductListItem[]> {
  return prisma.product.findMany({
    where: { isActive: true, isDeleted: false, isFeatured: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    include: listInclude,
  });
}

/**
 * Products currently on sale — those with a regular (compare) price genuinely
 * above the charged price. Ordered by category so callers can group them.
 * Prisma can't compare two columns in `where`, so we filter on `comparePrice`
 * being set in SQL, then drop non-discounted rows in JS.
 */
export async function getOnSaleProducts(): Promise<ProductListItem[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true, isDeleted: false, comparePrice: { not: null } },
    orderBy: [{ categoryId: "asc" }, { createdAt: "desc" }],
    include: listInclude,
  });
  return rows.filter(
    (p) => p.comparePrice != null && p.comparePrice.greaterThan(p.price),
  );
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true, isDeleted: false },
    include: {
      brand: { select: { name: true, slug: true } },
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { position: "asc" } },
      specs: { orderBy: { key: "asc" } },
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { name: true } } },
      },
    },
  });
}

export type ProductDetail = NonNullable<
  Awaited<ReturnType<typeof getProductBySlug>>
>;

export async function getRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  take = 12,
): Promise<ProductListItem[]> {
  // Strictly same-category suggestions — "more of this exact type", nothing else.
  return prisma.product.findMany({
    where: {
      isActive: true,
      isDeleted: false,
      categoryId,
      id: { not: excludeProductId },
    },
    orderBy: [{ ratingCount: "desc" }, { createdAt: "desc" }],
    take,
    include: listInclude,
  });
}

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

export async function getBrands() {
  return prisma.brand.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}
