"use client";

import { Printer, Download, X } from "lucide-react";

/**
 * Screen-only controls for the printable report view. Both actions open the
 * browser print dialog — the document is print-styled, so "Save as PDF" in that
 * dialog produces the downloadable PDF (there's no server-side PDF generator).
 *  • Download PDF → print dialog (pick "Save as PDF" as the destination).
 *  • Print        → print dialog (pick a printer).
 * Hidden in the actual print output.
 */
export function PrintControls() {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-hairline bg-surface-2 px-4 py-3 text-sm print:hidden sm:flex-row sm:items-center sm:justify-between">
      <span className="text-muted">
        Click <strong className="text-ink">Download PDF</strong> and choose
        &ldquo;Save as PDF&rdquo; as the destination, or <strong className="text-ink">Print</strong> to a printer.
      </span>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          data-testid="report-download"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-strong"
        >
          <Download className="h-4 w-4" /> Download PDF
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          data-testid="report-print"
          className="inline-flex items-center gap-1.5 rounded-lg border border-hairline-strong bg-surface px-4 py-2 font-medium text-ink hover:border-accent hover:text-accent"
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
