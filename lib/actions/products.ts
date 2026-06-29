"use server";

import { getProducts } from "@/lib/queries/product";
import { toCardData, type ProductCardData } from "@/lib/view/product-card-data";
import type { ProductFilter } from "@/lib/validators/product";

/** Fetches the next page of products (cursor-based) for the "Load more" button. */
export async function loadMoreProductsAction(
  filter: ProductFilter,
  cursor: string,
): Promise<{ items: ProductCardData[]; nextCursor: string | null }> {
  const page = await getProducts({ ...filter, cursor });
  return { items: page.items.map(toCardData), nextCursor: page.nextCursor };
}
