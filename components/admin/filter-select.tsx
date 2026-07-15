"use client";

import { cn } from "@/lib/utils/cn";

/**
 * Labeled native <select> for report filters. Submits its enclosing GET form on
 * change so a filter takes effect immediately (no separate Apply click needed),
 * while still degrading to the Apply button if JS is unavailable.
 */
export function FilterSelect({
  name,
  label,
  defaultValue = "",
  testId,
  children,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  testId?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col">
      <span className="text-xs text-muted">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        data-testid={testId}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={cn(
          "min-w-[9.5rem] rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-sm text-ink",
          "transition-colors hover:border-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20",
        )}
      >
        {children}
      </select>
    </label>
  );
}
