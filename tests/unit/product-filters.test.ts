import { describe, it, expect } from "vitest";
import {
  buildProductWhere,
  buildProductOrderBy,
} from "@/lib/queries/product-filters";
import type { ProductFilter } from "@/lib/validators/product";

const base: ProductFilter = { sort: "newest", inStock: false };

describe("buildProductWhere", () => {
  it("always restricts to active, non-deleted products", () => {
    expect(buildProductWhere(base)).toEqual({
      isActive: true,
      isDeleted: false,
    });
  });

  it("filters by category and brand slug", () => {
    const where = buildProductWhere({ ...base, category: "laptops", brand: "apple" });
    expect(where.category).toEqual({ slug: "laptops" });
    expect(where.brand).toEqual({ slug: "apple" });
  });

  it("builds a price range with gte/lte", () => {
    const where = buildProductWhere({ ...base, minPrice: 100, maxPrice: 500 });
    expect(where.price).toEqual({ gte: 100, lte: 500 });
  });

  it("supports an open-ended price range", () => {
    expect(buildProductWhere({ ...base, minPrice: 100 }).price).toEqual({ gte: 100 });
    expect(buildProductWhere({ ...base, maxPrice: 500 }).price).toEqual({ lte: 500 });
  });

  it("adds stock filter only when inStock is true", () => {
    expect(buildProductWhere({ ...base, inStock: true }).stock).toEqual({ gt: 0 });
    expect(buildProductWhere(base).stock).toBeUndefined();
  });

  it("filters by minimum rating only when > 0", () => {
    expect(buildProductWhere({ ...base, minRating: 4 }).ratingAvg).toEqual({ gte: 4 });
    expect(buildProductWhere({ ...base, minRating: 0 }).ratingAvg).toBeUndefined();
  });

  it("builds a case-insensitive name/description search", () => {
    const where = buildProductWhere({ ...base, q: "macbook" });
    expect(where.OR).toEqual([
      { name: { contains: "macbook", mode: "insensitive" } },
      { description: { contains: "macbook", mode: "insensitive" } },
    ]);
  });
});

describe("buildProductOrderBy", () => {
  it("always ends with a unique id tiebreaker for stable cursors", () => {
    for (const sort of ["newest", "price-asc", "price-desc", "popularity"] as const) {
      const orderBy = buildProductOrderBy(sort);
      expect(orderBy[orderBy.length - 1]).toHaveProperty("id");
    }
  });

  it("maps each sort option", () => {
    expect(buildProductOrderBy("newest")).toEqual([{ createdAt: "desc" }, { id: "desc" }]);
    expect(buildProductOrderBy("price-asc")).toEqual([{ price: "asc" }, { id: "asc" }]);
    expect(buildProductOrderBy("price-desc")).toEqual([{ price: "desc" }, { id: "desc" }]);
    expect(buildProductOrderBy("popularity")).toEqual([
      { ratingCount: "desc" },
      { ratingAvg: "desc" },
      { id: "desc" },
    ]);
  });
});
