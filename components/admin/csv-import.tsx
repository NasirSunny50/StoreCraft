"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bulkUploadProducts, type BulkUploadResult } from "@/lib/actions/admin-product";
import { Button } from "@/components/ui/button";

const SAMPLE = `name,description,price,stock,category,brand,comparePrice
Logitech MX Master 3S,Ergonomic wireless mouse,9900,25,Accessories,,11900
JBL Flip 6,Portable bluetooth speaker,12900,15,Audio,Sony,`;

export function CsvImport() {
  const router = useRouter();
  const [text, setText] = useState(SAMPLE);
  const [result, setResult] = useState<BulkUploadResult | null>(null);
  const [pending, startTransition] = useTransition();

  function upload() {
    startTransition(async () => {
      const res = await bulkUploadProducts(text);
      setResult(res);
      router.refresh();
    });
  }

  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm text-muted">
        Header row required: <code className="rounded bg-surface-2 px-1">name,description,price,stock,category,brand,comparePrice</code>.
        Category/brand are matched by name (must already exist). Bad rows are reported and skipped.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        data-testid="csv-text"
        className="w-full rounded border border-hairline-strong p-3 font-mono text-xs outline-none focus:border-accent"
      />
      <Button variant="accent" disabled={pending} data-testid="csv-upload" onClick={upload}>
        {pending ? "Importing…" : "Import products"}
      </Button>

      {result && (
        <div data-testid="csv-result" className="rounded border border-hairline bg-surface p-4 text-sm">
          {result.error ? (
            <p className="text-accent">{result.error}</p>
          ) : (
            <>
              <p className="font-medium text-ink">
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
    </div>
  );
}
