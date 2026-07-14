"use client";

import { Printer, X } from "lucide-react";

/**
 * Screen-only controls for the printable report view. The user clicks
 * "Print / Save as PDF" to open the browser print dialog and pick "Save as
 * PDF". Hidden in the actual print output.
 */
export function PrintControls() {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-hairline bg-surface-2 px-4 py-3 text-sm print:hidden">
      <span className="text-muted">
        Click <strong className="text-ink">Print / Save as PDF</strong>, then choose
        &ldquo;Save as PDF&rdquo; as the destination.
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-strong"
        >
          <Printer className="h-4 w-4" /> Print / Save as PDF
        </button>
        <button
          type="button"
          onClick={() => window.close()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-hairline-strong px-3 py-2 font-medium text-ink hover:bg-surface"
        >
          <X className="h-4 w-4" /> Close
        </button>
      </div>
    </div>
  );
}
