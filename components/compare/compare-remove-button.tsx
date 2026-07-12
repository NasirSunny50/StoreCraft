"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useCompare } from "@/components/compare/compare-context";

/**
 * Removes a product column from the comparison. Updates the shared compare
 * state and reloads /compare with the trimmed id list.
 */
export function CompareRemoveButton({ productId }: { productId: string }) {
  const { remove, ids } = useCompare();
  const router = useRouter();

  function onRemove() {
    remove(productId);
    const next = ids.filter((id) => id !== productId);
    router.push(next.length ? `/compare?ids=${next.join(",")}` : "/compare");
  }

  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label="Remove from comparison"
      className="inline-flex items-center gap-1 text-xs text-muted hover:text-accent"
    >
      <X className="h-3.5 w-3.5" /> Remove
    </button>
  );
}
