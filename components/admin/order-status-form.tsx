"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { updateOrderStatus } from "@/lib/actions/admin-order";
import { BD_COURIERS } from "@/lib/validators/order-tracking";
import { Button } from "@/components/ui/button";

const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

export function OrderStatusForm({
  orderId,
  current,
  tracking,
}: {
  orderId: string;
  current: OrderStatus;
  tracking?: { carrier?: string | null; number?: string | null; url?: string | null };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<OrderStatus>(current);
  const [note, setNote] = useState("");
  const initialCarrier = tracking?.carrier ?? "";
  const [carrier, setCarrier] = useState(initialCarrier);
  // A saved courier that isn't one of the presets starts in "Other" (free-text) mode.
  const [carrierIsOther, setCarrierIsOther] = useState(
    initialCarrier !== "" && !BD_COURIERS.includes(initialCarrier as (typeof BD_COURIERS)[number]),
  );
  const [trackNo, setTrackNo] = useState(tracking?.number ?? "");
  const [trackUrl, setTrackUrl] = useState(tracking?.url ?? "");
  const [error, setError] = useState<string | null>(null);

  const inputCls = "w-full rounded border border-hairline-strong px-3 py-2 text-sm";

  function update() {
    setError(null);
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, status, note, {
        carrier,
        number: trackNo,
        url: trackUrl,
      });
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
        className={inputCls}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {status === "SHIPPED" && (
        <div className="space-y-2 rounded border border-hairline bg-surface-2 p-3">
          <p className="text-xs font-semibold text-ink">Courier tracking (optional)</p>
          <select
            value={carrierIsOther ? "__other" : carrier}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "__other") {
                setCarrierIsOther(true);
                setCarrier("");
              } else {
                setCarrierIsOther(false);
                setCarrier(v);
              }
            }}
            data-testid="tracking-carrier"
            className={inputCls}
          >
            <option value="">Select courier…</option>
            {BD_COURIERS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="__other">Other…</option>
          </select>
          {carrierIsOther && (
            <input
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              placeholder="Courier name"
              data-testid="tracking-carrier-other"
              className={inputCls}
            />
          )}
          <input
            value={trackNo}
            onChange={(e) => setTrackNo(e.target.value)}
            placeholder="Tracking number / consignment ID"
            data-testid="tracking-number"
            className={inputCls}
          />
          <input
            type="url"
            value={trackUrl}
            onChange={(e) => setTrackUrl(e.target.value)}
            placeholder="Tracking link (https://…)"
            data-testid="tracking-url"
            className={inputCls}
          />
          <p className="text-[11px] text-muted">
            The customer sees these on their order page and in the shipped email.
          </p>
        </div>
      )}

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Note (optional, e.g. refund reason)"
        data-testid="order-status-note"
        className={inputCls}
      />
      <Button variant="accent" size="sm" disabled={pending} data-testid="order-status-update" onClick={update}>
        {pending ? "Updating…" : "Update status"}
      </Button>
      {error && <p className="text-xs text-accent" data-testid="order-status-error">{error}</p>}
    </div>
  );
}
