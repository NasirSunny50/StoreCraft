"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const TABS = ["Specification", "Description", "Warranty"] as const;
type Tab = (typeof TABS)[number];

/**
 * Pill-style tab switcher for the product detail page (marketplace pattern:
 * Specification / Description / Warranty). Specification is the default so
 * the spec table is visible on load.
 */
export function ProductTabs({
  specification,
  description,
  warranty,
}: {
  specification: ReactNode;
  description: ReactNode;
  warranty: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("Specification");
  const content: Record<Tab, ReactNode> = {
    Specification: specification,
    Description: description,
    Warranty: warranty,
  };

  return (
    <div className="rounded border border-hairline bg-surface">
      <div className="flex flex-wrap gap-2 border-b border-hairline px-4 py-3" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={t === tab}
            data-testid={`product-tab-${t.toLowerCase()}`}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              t === tab ? "bg-accent text-white" : "bg-surface-2 text-ink hover:bg-accent/10 hover:text-accent",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="p-4">{content[tab]}</div>
    </div>
  );
}
