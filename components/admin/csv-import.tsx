"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, UploadCloud, FileText, X, CheckCircle2, ChevronDown } from "lucide-react";
import { bulkUploadProducts, type BulkUploadResult } from "@/lib/actions/admin-product";
import { parseCsv } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

// Ready-to-fill template: header + a few example rows (one description is quoted
// to show how to include commas). Column labels match the "Add product" form.
// Categories/brands must already exist.
const TEMPLATE = `Name,Description,Regular Price,Sale Price,Cost Price,Stock,Category,Brand
Wireless Mouse Pro,"Ergonomic 2.4GHz wireless mouse, silent clicks",1590,1290,900,50,Mouse,
Mechanical Keyboard K1,RGB hot-swappable mechanical keyboard,3490,,2400,30,Keyboard,
ANC Headphones X,Over-ear noise-cancelling headphones with 30h battery,10900,8900,6500,20,Audio,Sony`;

const COLUMNS: { key: string; required: boolean; example: string; note: string }[] = [
  { key: "Name", required: true, example: "Wireless Mouse Pro", note: "Product title" },
  { key: "Description", required: true, example: "Ergonomic wireless mouse", note: "Wrap in \"quotes\" if it has commas" },
  { key: "Regular Price", required: true, example: "1590", note: "Normal price (৳), numbers only" },
  { key: "Sale Price", required: false, example: "1290", note: "Optional · discounted price, must be less than Regular Price" },
  { key: "Cost Price", required: false, example: "900", note: "Optional · buying price, for profit reports" },
  { key: "Stock", required: true, example: "50", note: "Quantity in stock" },
  { key: "Category", required: true, example: "Mouse", note: "Must already exist" },
  { key: "Brand", required: false, example: "Sony", note: "Optional · must exist if given" },
];

export function CsvImport() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [result, setResult] = useState<BulkUploadResult | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product-import-template.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function loadText(t: string, name: string | null) {
    setText(t);
    setFileName(name);
    setResult(null);
    try {
      setRowCount(parseCsv(t).length);
    } catch {
      setRowCount(null);
    }
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => loadText(String(reader.result ?? ""), file.name);
    reader.readAsText(file);
  }

  function clearFile() {
    setText("");
    setFileName(null);
    setRowCount(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function upload() {
    startTransition(async () => {
      const res = await bulkUploadProducts(text);
      setResult(res);
      router.refresh();
    });
  }

  const hasData = text.trim() !== "";

  return (
    <div className="max-w-3xl space-y-4">
      {/* Step 1 — template */}
      <section className="rounded-xl border border-hairline bg-surface p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-accent/10 text-[11px] font-bold text-accent">1</span>
              Download the template
            </h2>
            <p className="mt-1 text-xs text-muted">
              Open it in Excel or Google Sheets, fill in your products (keep the header row), then
              save as CSV.
            </p>
          </div>
          <Button variant="soft" size="sm" onClick={downloadTemplate} data-testid="csv-template-download" className="shrink-0">
            <Download className="h-4 w-4" /> Download template
          </Button>
        </div>
      </section>

      {/* Step 2 — upload */}
      <section className="rounded-xl border border-hairline bg-surface p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-accent/10 text-[11px] font-bold text-accent">2</span>
          Upload your file
        </h2>

        {!fileName ? (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            className={cn(
              "mt-3 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
              dragActive ? "border-accent bg-accent/5" : "border-hairline-strong hover:border-accent hover:bg-surface-2",
            )}
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-accent/10 text-accent">
              <UploadCloud className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium text-ink">
              Drop your CSV here, or <span className="text-accent">browse</span>
            </span>
            <span className="text-xs text-muted">.csv files only</span>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-hairline bg-surface-2 p-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink">{fileName}</div>
              <div className="text-xs text-muted">
                {rowCount !== null ? `${rowCount} product${rowCount === 1 ? "" : "s"} detected` : "Ready to import"}
              </div>
            </div>
            <button
              type="button"
              onClick={clearFile}
              aria-label="Remove file"
              className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-surface hover:text-accent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          data-testid="csv-file-input"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
          className="hidden"
        />

        {/* Manual paste fallback */}
        <button
          type="button"
          onClick={() => setShowPaste((v) => !v)}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-link hover:text-accent"
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showPaste && "rotate-180")} />
          Or paste CSV manually
        </button>
        {showPaste && (
          <textarea
            value={text}
            onChange={(e) => loadText(e.target.value, e.target.value.trim() ? "pasted.csv" : null)}
            rows={8}
            placeholder="Paste CSV rows here…"
            data-testid="csv-text"
            className="mt-2 w-full rounded border border-hairline-strong p-3 font-mono text-xs outline-none focus:border-accent"
          />
        )}

        <div className="mt-4">
          <Button variant="accent" disabled={pending || !hasData} data-testid="csv-upload" onClick={upload}>
            {pending ? "Importing…" : "Import products"}
          </Button>
        </div>

        {result && (
          <div data-testid="csv-result" className="mt-4 rounded-lg border border-hairline bg-surface-2 p-4 text-sm">
            {result.error ? (
              <p className="text-accent">{result.error}</p>
            ) : (
              <>
                <p className="flex items-center gap-2 font-medium text-ink">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Imported <span data-testid="csv-created">{result.created}</span> of {result.total} rows.
                  {result.errors.length > 0 && ` ${result.errors.length} rejected.`}
                </p>
                {result.errors.length > 0 && (
                  <ul className="mt-2 space-y-1 text-accent" data-testid="csv-errors">
                    {result.errors.map((e, i) => (
                      <li key={i}>Row {e.row}: {e.message}</li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}
      </section>

      {/* Column reference */}
      <section className="rounded-xl border border-hairline bg-surface p-4 sm:p-5">
        <h2 className="text-sm font-bold text-ink">Columns</h2>
        <p className="mt-1 text-xs text-muted">Category and brand are matched by name and must already exist. Bad rows are skipped and reported.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[460px] text-xs">
            <thead className="text-left text-muted">
              <tr>
                <th className="py-1.5 pr-3 font-medium">Column</th>
                <th className="py-1.5 pr-3 font-medium">Required</th>
                <th className="py-1.5 pr-3 font-medium">Example</th>
                <th className="py-1.5 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {COLUMNS.map((c) => (
                <tr key={c.key}>
                  <td className="py-1.5 pr-3"><code className="rounded bg-surface-2 px-1 font-mono">{c.key}</code></td>
                  <td className="py-1.5 pr-3">
                    {c.required ? (
                      <span className="font-medium text-accent">Required</span>
                    ) : (
                      <span className="text-muted">Optional</span>
                    )}
                  </td>
                  <td className="py-1.5 pr-3 text-ink">{c.example}</td>
                  <td className="py-1.5 text-muted">{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
