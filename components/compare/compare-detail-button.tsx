"use client";

import Link from "next/link";
import { GitCompare, Check } from "lucide-react";
import { useCompare, MAX_COMPARE } from "@/components/compare/compare-context";

/**
 * Full-width compare control for the product detail page. Toggles the product
 * into the compare list and, once added, offers a link to the comparison table.
 */
export function CompareDetailButton({ productId }: { productId: string }) {
  const { has, toggle, isFull, ids, ready } = useCompare();
  const active = ready && has(productId);
  const blocked = ready && !active && isFull;

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => toggle(productId)}
        disabled={blocked}
        aria-pressed={active}
        data-testid="detail-compare"
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          active
            ? "border-accent bg-accent/5 text-accent"
            : "border-hairline-strong text-ink hover:border-ink"
        }`}
      >
        {active ? <Check className="h-4 w-4" /> : <GitCompare className="h-4 w-4" />}
        {active ? "Added to Compare" : "Add to Compare"}
      </button>

      {active && ids.length >= 2 && (
        <Link
          href={`/compare?ids=${ids.join(",")}`}
          className="text-sm font-medium text-accent hover:underline"
        >
          Compare ({ids.length})
        </Link>
      )}
      {blocked && (
        <span className="text-xs text-muted">Compare list full (max {MAX_COMPARE})</span>
      )}
    </div>
  );
}
