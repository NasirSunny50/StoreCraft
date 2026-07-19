"use client";

import { Printer, Download, X } from "lucide-react";

/**
 * Screen-only controls for the printable report view.
 *  • Download  → the same report as a CSV file (opens the export route).
 *  • Print     → the browser print dialog (choose a printer or "Save as PDF").
 * Hidden in the actual print output.
 */
export function PrintControls({ csvHref }: { csvHref?: string }) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-hairline bg-surface-2 px-4 py-3 text-sm print:hidden sm:flex-row sm:items-center sm:justify-between">
      <span className="text-muted">
        <strong className="text-ink">Download</strong> the data as CSV, or{" "}
        <strong className="text-ink">Print</strong> and choose &ldquo;Save as PDF&rdquo;.
      </span>
      <div className="flex flex-wrap gap-2">
        {csvHref && (
          <a
            href={csvHref}
            data-testid="report-download-csv"
            className="inline-flex items-center gap-1.5 rounded-lg border border-hairline-strong bg-surface px-4 py-2 font-medium text-ink hover:border-accent hover:text-accent"
          >
            <Download className="h-4 w-4" /> Download
          </a>
        )}
        <button
          type="button"
          onClick={() => window.print()}
          data-testid="report-print"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-strong"
        >
          <Printer className="h-4 w-4" /> Print
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
