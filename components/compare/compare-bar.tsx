"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GitCompare } from "lucide-react";
import { useCompare } from "@/components/compare/compare-context";

/**
 * Floating bar that appears once products are pinned for comparison. Sits above
 * the mobile bottom nav; links to /compare?ids=... which renders the table.
 */
export function CompareBar() {
  const { ids, ready, clear } = useCompare();
  const pathname = usePathname();
  // On the comparison page itself the floating bar is redundant.
  if (!ready || ids.length === 0 || pathname === "/compare") return null;

  const href = `/compare?ids=${ids.join(",")}`;
  const tooFew = ids.length < 2;

  return (
    <div
      data-testid="compare-bar"
      className="fixed inset-x-0 bottom-16 z-40 px-4 lg:bottom-4"
    >
      <div className="mx-auto flex max-w-lg items-center gap-3 rounded-lg border border-hairline bg-surface px-3 py-2.5 shadow-card-hover">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <GitCompare className="h-4 w-4 text-accent" />
          Compare
          <span className="rounded-full bg-accent px-1.5 text-xs font-bold text-white">
            {ids.length}
          </span>
        </span>

        <span className="hidden text-xs text-muted sm:inline">
          {tooFew ? "Add one more to compare" : "products selected"}
        </span>

        <button
          type="button"
          onClick={clear}
          className="ml-auto shrink-0 text-xs text-muted hover:text-accent"
        >
          Clear
        </button>
        <Link
          href={href}
          data-testid="compare-bar-go"
          className={`shrink-0 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-strong ${
            tooFew ? "pointer-events-none opacity-50" : ""
          }`}
          aria-disabled={tooFew}
        >
          Compare
        </Link>
      </div>
    </div>
  );
}
