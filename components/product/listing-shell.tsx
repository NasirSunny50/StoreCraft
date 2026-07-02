"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { SORT_OPTIONS } from "@/components/product/product-filters";

/**
 * Responsive chrome around the listing page (marketplace pattern):
 * - mobile: "Sort By" pill + "Filter" pill that opens a right slide-in drawer
 * - lg+: static filter sidebar next to the results
 * The filter form is passed in once and shown in whichever container applies.
 */
export function ListingShell({
  sort,
  filters,
  children,
}: {
  sort: string;
  filters: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  // Close the drawer whenever a filter/sort navigation lands. Depend on the
  // serialized value — the searchParams object identity changes per render.
  const qs = searchParams.toString();
  useEffect(() => setOpen(false), [qs]);

  function setSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <>
      {/* Mobile toolbar */}
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <label className="flex items-center gap-2 rounded-full border border-hairline-strong bg-surface px-4 py-2 text-sm font-medium text-ink">
          Sort
          <select
            value={sort}
            data-testid="mobile-sort"
            onChange={(e) => setSort(e.target.value)}
            className="max-w-36 bg-transparent text-sm outline-none"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          data-testid="mobile-filter-button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-navbar px-5 py-2.5 text-sm font-semibold text-white"
        >
          Filter <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid gap-6 lg:mt-5 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">{filters}</aside>
        <div className="min-w-0">{children}</div>
      </div>

      {/* Mobile filter drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" data-testid="filter-drawer">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-80 max-w-[85%] flex-col bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
              <span className="text-base font-bold text-ink">Filters</span>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded text-muted hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{filters}</div>
          </div>
        </div>
      )}
    </>
  );
}
