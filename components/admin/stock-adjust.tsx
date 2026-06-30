"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adjustStock } from "@/lib/actions/admin-inventory";
import { Button } from "@/components/ui/button";

export function StockAdjust({ productId }: { productId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function apply() {
    setError(null);
    startTransition(async () => {
      const res = await adjustStock(productId, Number(delta), reason || "MANUAL_ADJUST");
      if (!res.ok) setError(res.error ?? "Failed.");
      else {
        setDelta("");
        setReason("");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="number"
        value={delta}
        onChange={(e) => setDelta(e.target.value)}
        placeholder="+/−"
        data-testid="stock-delta"
        className="w-20 rounded border border-hairline-strong px-2 py-1 text-sm"
      />
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason"
        className="w-32 rounded border border-hairline-strong px-2 py-1 text-sm"
      />
      <Button variant="soft" size="sm" disabled={pending || !delta} data-testid="stock-apply" onClick={apply}>
        Apply
      </Button>
      {error && <span className="text-xs text-accent" data-testid="stock-error">{error}</span>}
    </div>
  );
}
