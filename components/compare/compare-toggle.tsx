"use client";

import { GitCompare } from "lucide-react";
import { useCompare, MAX_COMPARE } from "@/components/compare/compare-context";

/** Compact compare toggle for product cards — pins the product to the compare bar. */
export function CompareToggle({ productId }: { productId: string }) {
  const { has, toggle, isFull, ready } = useCompare();
  const active = ready && has(productId);
  const blocked = ready && !active && isFull;

  return (
    <button
      type="button"
      onClick={() => toggle(productId)}
      disabled={blocked}
      aria-pressed={active}
      title={
        active
          ? "Remove from compare"
          : blocked
            ? `Compare list is full (max ${MAX_COMPARE})`
            : "Add to compare"
      }
      aria-label="Add to compare"
      data-testid="card-compare"
      className={`absolute right-2 top-11 z-10 grid h-8 w-8 place-items-center rounded-full border shadow-card disabled:opacity-40 ${
        active
          ? "border-accent bg-accent text-white"
          : "border-hairline bg-white/90 text-muted hover:text-accent"
      }`}
    >
      <GitCompare className="h-4 w-4" strokeWidth={1.5} />
    </button>
  );
}
