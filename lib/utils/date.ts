// Shared, modern date formatting for reports & admin views.
// en-GB gives day-first "15 Jul 2026" — compact and unambiguous.
const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Format a date as "15 Jul 2026". */
export function formatDate(d: Date | string): string {
  return DATE_FMT.format(typeof d === "string" ? new Date(d) : d);
}
