"use client";

import { useRouter, usePathname } from "next/navigation";
import type { ProductFilter } from "@/lib/validators/product";

type Option = { id: string; name: string; slug: string };

const SORT_OPTIONS: { value: ProductFilter["sort"]; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "popularity", label: "Most popular" },
];

export function ProductFilters({
  filter,
  categories,
  brands,
  lockCategory = false,
  lockBrand = false,
}: {
  filter: ProductFilter;
  categories: Option[];
  brands: Option[];
  lockCategory?: boolean;
  lockBrand?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function apply(form: HTMLFormElement) {
    const fd = new FormData(form);
    const params = new URLSearchParams();
    for (const key of ["q", "category", "brand", "minPrice", "maxPrice", "minRating", "sort"]) {
      const v = fd.get(key);
      if (v !== null && String(v).trim() !== "") params.set(key, String(v).trim());
    }
    if (fd.get("inStock")) params.set("inStock", "true");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <form
      // Remount when the active filter changes so inputs reflect the URL.
      key={JSON.stringify(filter)}
      data-testid="product-filters"
      onSubmit={(e) => {
        e.preventDefault();
        apply(e.currentTarget);
      }}
      className="space-y-4 rounded-lg border border-gray-200 p-4 text-sm dark:border-gray-800"
    >
      <div className="space-y-1">
        <label htmlFor="q" className="block font-medium">
          Search
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={filter.q ?? ""}
          placeholder="Search products…"
          data-testid="filter-q"
          className="w-full rounded-md border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      {!lockCategory && (
        <div className="space-y-1">
          <label htmlFor="category" className="block font-medium">
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={filter.category ?? ""}
            data-testid="filter-category"
            className="w-full rounded-md border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {!lockBrand && (
        <div className="space-y-1">
          <label htmlFor="brand" className="block font-medium">
            Brand
          </label>
          <select
            id="brand"
            name="brand"
            defaultValue={filter.brand ?? ""}
            data-testid="filter-brand"
            className="w-full rounded-md border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1">
        <span className="block font-medium">Price range</span>
        <div className="flex items-center gap-2">
          <input
            name="minPrice"
            type="number"
            min={0}
            defaultValue={filter.minPrice ?? ""}
            placeholder="Min"
            data-testid="filter-min-price"
            className="w-full rounded-md border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-900"
          />
          <span>–</span>
          <input
            name="maxPrice"
            type="number"
            min={0}
            defaultValue={filter.maxPrice ?? ""}
            placeholder="Max"
            data-testid="filter-max-price"
            className="w-full rounded-md border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-900"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="minRating" className="block font-medium">
          Minimum rating
        </label>
        <select
          id="minRating"
          name="minRating"
          defaultValue={filter.minRating ? String(filter.minRating) : ""}
          data-testid="filter-rating"
          className="w-full rounded-md border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="">Any rating</option>
          <option value="4">4★ &amp; up</option>
          <option value="3">3★ &amp; up</option>
          <option value="2">2★ &amp; up</option>
        </select>
      </div>

      <label className="flex items-center gap-2">
        <input
          name="inStock"
          type="checkbox"
          value="true"
          defaultChecked={filter.inStock}
          data-testid="filter-in-stock"
        />
        In stock only
      </label>

      <div className="space-y-1">
        <label htmlFor="sort" className="block font-medium">
          Sort by
        </label>
        <select
          id="sort"
          name="sort"
          defaultValue={filter.sort}
          data-testid="filter-sort"
          className="w-full rounded-md border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-900"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          data-testid="apply-filters"
          className="flex-1 rounded-md bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-700"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => router.push(pathname)}
          data-testid="clear-filters"
          className="rounded-md border border-gray-300 px-3 py-1.5 font-medium hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          Clear
        </button>
      </div>
    </form>
  );
}
