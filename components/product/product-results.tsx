"use client";

import { useState, useTransition } from "react";
import { ProductCard } from "@/components/product/product-card";
import { loadMoreProductsAction } from "@/lib/actions/products";
import type { ProductCardData } from "@/lib/view/product-card-data";
import type { ProductFilter } from "@/lib/validators/product";

export function ProductResults({
  initialItems,
  initialCursor,
  filter,
}: {
  initialItems: ProductCardData[];
  initialCursor: string | null;
  filter: ProductFilter;
}) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [pending, startTransition] = useTransition();

  function loadMore() {
    if (!cursor) return;
    startTransition(async () => {
      const res = await loadMoreProductsAction(filter, cursor);
      setItems((prev) => [...prev, ...res.items]);
      setCursor(res.nextCursor);
    });
  }

  if (items.length === 0) {
    return (
      <div
        data-testid="empty-state"
        className="rounded-lg border border-dashed border-gray-300 py-16 text-center text-gray-500 dark:border-gray-700"
      >
        <p className="text-lg font-medium">No products found</p>
        <p className="text-sm">Try adjusting your filters or search.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        data-testid="product-grid"
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      >
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {cursor && (
        <div className="text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={pending}
            data-testid="load-more"
            className="rounded-md border border-gray-300 px-6 py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            {pending ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
