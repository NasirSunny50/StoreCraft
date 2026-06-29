import { cn } from "@/lib/utils/cn";

/** Amber star rating (marketplace style). Rounds to nearest half. */
export function StarRating({
  value,
  count,
  showCount = true,
}: {
  value: number;
  count?: number;
  showCount?: boolean;
}) {
  const rounded = Math.round(value * 2) / 2;

  return (
    <span
      className="inline-flex items-center gap-1"
      aria-label={`Rating ${value.toFixed(1)} out of 5`}
    >
      <span className="inline-flex text-[13px] leading-none" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={cn(rounded >= i - 0.25 ? "text-star" : "text-hairline-strong")}
          >
            ★
          </span>
        ))}
      </span>
      {showCount && count !== undefined && (
        <span className="text-[11px] text-muted" data-testid="rating-count">
          ({count})
        </span>
      )}
    </span>
  );
}
