import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { getProducts } from "@/lib/queries/product";
import type { ProductFilter } from "@/lib/validators/product";

const baseFilter: ProductFilter = { sort: "newest", inStock: false };

async function paginateAll(
  filter: ProductFilter,
  pageSize = 2,
): Promise<{ id: string; price: number; stock: number }[]> {
  const collected: { id: string; price: number; stock: number }[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 50; i++) {
    const page = await getProducts({ ...filter, cursor }, pageSize);
    collected.push(
      ...page.items.map((p) => ({
        id: p.id,
        price: Number(p.price),
        stock: p.stock,
      })),
    );
    if (!page.nextCursor) break;
    cursor = page.nextCursor;
  }
  return collected;
}

describe("getProducts cursor pagination (DB)", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("walks every product once, with no duplicates across pages", async () => {
    const all = await paginateAll(baseFilter, 2);
    const ids = all.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length); // no duplicates across pages
    expect(ids.length).toBeGreaterThanOrEqual(6); // at least the seeded products
  });

  it("keeps price-asc ordering stable across page boundaries", async () => {
    const all = await paginateAll({ ...baseFilter, sort: "price-asc" }, 2);
    const prices = all.map((p) => p.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it("inStock filter excludes zero-stock products", async () => {
    const page = await getProducts({ ...baseFilter, inStock: true }, 100);
    expect(page.items.every((p) => p.stock > 0)).toBe(true); // no zero-stock leaks
    expect(page.items.length).toBeGreaterThanOrEqual(5); // seeded in-stock products
  });

  it("a final page returns a null cursor", async () => {
    const page = await getProducts(baseFilter, 100);
    expect(page.nextCursor).toBeNull();
  });
});
