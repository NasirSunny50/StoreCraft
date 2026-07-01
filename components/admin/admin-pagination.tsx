"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PER_PAGE_OPTIONS } from "@/lib/pagination";
import { cn } from "@/lib/utils/cn";

export function AdminPagination({
  total,
  page,
  perPage,
  pageKey = "page",
  perPageKey = "perPage",
  testId = "admin-pagination",
}: {
  total: number;
  page: number;
  perPage: number;
  /** Override to run multiple independent paginators on one page. */
  pageKey?: string;
  perPageKey?: string;
  testId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (current - 1) * perPage + 1;
  const to = Math.min(current * perPage, total);

  function push(next: { page?: number; perPage?: number }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.perPage !== undefined) {
      params.set(perPageKey, String(next.perPage));
      params.set(pageKey, "1"); // reset to first page when size changes
    }
    if (next.page !== undefined) params.set(pageKey, String(next.page));
    // scroll: false keeps the viewport where it is, so paging a lower table
    // (e.g. Recent stock changes) doesn't jump back to the top of the page.
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  // Scope child test-ids to the container when a custom testId is set, so that
  // multiple paginators on one page don't collide under Playwright strict mode.
  const cid = (base: string) => (testId === "admin-pagination" ? base : `${testId}-${base}`);

  // Window of page numbers around the current page.
  const delta = 2;
  const numbers: number[] = [];
  for (let i = Math.max(1, current - delta); i <= Math.min(totalPages, current + delta); i++) {
    numbers.push(i);
  }

  return (
    <div className="mt-3 flex flex-col items-center justify-between gap-3 text-sm sm:flex-row" data-testid={testId}>
      <div className="flex items-center gap-2">
        <label htmlFor={perPageKey} className="text-muted">Rows per page:</label>
        <select
          id={perPageKey}
          data-testid={cid("per-page-select")}
          value={perPage}
          onChange={(e) => push({ perPage: Number(e.target.value) })}
          className="rounded border border-hairline-strong px-2 py-1"
        >
          {PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span className="text-muted" data-testid={cid("pagination-summary")}>
          {from}–{to} of {total}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          data-testid={cid("page-prev")}
          disabled={current <= 1}
          onClick={() => push({ page: current - 1 })}
          className="grid h-8 w-8 place-items-center rounded border border-hairline-strong disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {numbers.map((n) => (
          <button
            key={n}
            type="button"
            data-testid={cid("page-number")}
            aria-current={n === current}
            onClick={() => push({ page: n })}
            className={cn(
              "h-8 min-w-8 rounded border px-2 text-xs font-medium",
              n === current ? "border-accent bg-accent text-white" : "border-hairline-strong hover:bg-surface-2",
            )}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          data-testid={cid("page-next")}
          disabled={current >= totalPages}
          onClick={() => push({ page: current + 1 })}
          className="grid h-8 w-8 place-items-center rounded border border-hairline-strong disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
