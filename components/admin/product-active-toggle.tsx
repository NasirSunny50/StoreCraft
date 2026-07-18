"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setProductActive } from "@/lib/actions/admin-product";
import { cn } from "@/lib/utils/cn";

/**
 * Inline Active/Inactive switch for the product list, so an admin can flip a
 * product's visibility without opening it. Optimistic-feel: disabled while the
 * server action runs, then the row refreshes.
 */
export function ProductActiveToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await setProductActive(id, !isActive);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      aria-label={isActive ? "Deactivate product" : "Activate product"}
      disabled={pending}
      onClick={toggle}
      data-testid="product-active-toggle"
      className={cn(
        "inline-flex items-center gap-2 rounded-full disabled:opacity-60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
      )}
    >
      <span
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          isActive ? "bg-green-600" : "bg-hairline-strong",
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
            isActive ? "translate-x-[18px]" : "translate-x-[2px]",
          )}
        />
      </span>
      <span
        className={cn(
          "text-xs font-semibold",
          isActive ? "text-green-700" : "text-muted",
        )}
      >
        {isActive ? "Active" : "Inactive"}
      </span>
    </button>
  );
}
