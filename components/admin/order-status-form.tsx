"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { updateOrderStatus } from "@/lib/actions/admin-order";
import { Button } from "@/components/ui/button";

const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

export function OrderStatusForm({
  orderId,
  current,
}: {
  orderId: string;
  current: OrderStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<OrderStatus>(current);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function update() {
    setError(null);
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, status, note);
      if (!res.ok) setError(res.error ?? "Failed.");
      else {
        setNote("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as OrderStatus)}
        data-testid="order-status-select"
        className="w-full rounded border border-hairline-strong px-3 py-2 text-sm"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Note (optional, e.g. refund reason)"
        data-testid="order-status-note"
        className="w-full rounded border border-hairline-strong px-3 py-2 text-sm"
      />
      <Button variant="accent" size="sm" disabled={pending} data-testid="order-status-update" onClick={update}>
        {pending ? "Updating…" : "Update status"}
      </Button>
      {error && <p className="text-xs text-accent" data-testid="order-status-error">{error}</p>}
    </div>
  );
}
