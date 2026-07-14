"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "YYYY-MM-DD" → local Date (avoids the UTC shift of `new Date(str)`). */
function parseYmd(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}
function toYmd(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Modern date picker with a custom, fully-styled calendar popover. The whole
 * trigger field opens the calendar (not just an icon). Submits its value via a
 * hidden input named `name`, so it drops into a normal GET form unchanged.
 */
export function DatePicker({
  name,
  label,
  defaultValue = "",
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const selected = parseYmd(value);
  const today = new Date();
  const [view, setView] = useState<Date>(() => selected ?? new Date(today.getFullYear(), today.getMonth(), 1));
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function openCal() {
    if (selected) setView(new Date(selected.getFullYear(), selected.getMonth(), 1));
    setOpen(true);
  }
  function shiftMonth(delta: number) {
    setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));
  }
  function pick(d: Date) {
    setValue(toYmd(d));
    setOpen(false);
  }
  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    setValue("");
    setOpen(false);
  }

  // Build the 6-week day grid for the viewed month.
  const firstOfMonth = new Date(view.getFullYear(), view.getMonth(), 1);
  const startOffset = firstOfMonth.getDay();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(view.getFullYear(), view.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);

  const displayText = selected
    ? `${selected.getDate()} ${MONTHS[selected.getMonth()]!.slice(0, 3)} ${selected.getFullYear()}`
    : "Any date";

  return (
    <div ref={rootRef} className="relative flex flex-col">
      <span className="text-xs text-muted">{label}</span>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openCal())}
        data-testid={`datepicker-${name}`}
        className={cn(
          "flex min-w-[9.5rem] items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
          open ? "border-accent ring-2 ring-accent/20" : "border-hairline-strong hover:border-ink",
        )}
      >
        <Calendar className="h-4 w-4 shrink-0 text-muted" />
        <span className={cn("flex-1", selected ? "text-ink" : "text-muted")}>{displayText}</span>
        {selected && (
          <span
            role="button"
            aria-label="Clear date"
            onClick={clear}
            className="grid h-4 w-4 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-accent"
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </button>

      {open && (
        <div
          data-testid={`calendar-${name}`}
          className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-hairline bg-surface p-3 shadow-card-hover"
        >
          {/* Month header */}
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month" className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-ink">
              {MONTHS[view.getMonth()]} {view.getFullYear()}
            </span>
            <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month" className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday row */}
          <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] font-medium text-muted">
            {WEEKDAYS.map((w) => <span key={w} className="py-1">{w}</span>)}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((d, i) =>
              d === null ? (
                <span key={i} />
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(d)}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-full text-sm transition-colors",
                    selected && sameDay(d, selected)
                      ? "bg-accent font-semibold text-white"
                      : sameDay(d, today)
                        ? "text-accent ring-1 ring-accent/40 hover:bg-surface-2"
                        : "text-ink hover:bg-surface-2",
                  )}
                >
                  {d.getDate()}
                </button>
              ),
            )}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-hairline pt-2">
            <button type="button" onClick={() => pick(new Date())} className="text-xs font-medium text-link hover:text-accent">
              Today
            </button>
            <button type="button" onClick={() => { setValue(""); setOpen(false); }} className="text-xs text-muted hover:text-accent">
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
