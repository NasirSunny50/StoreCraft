"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Phone, Check, Trash2 } from "lucide-react";
import {
  setDefaultAddressAction,
  deleteAddressAction,
} from "@/lib/actions/address";
import type { AddressView } from "@/components/checkout/checkout-form";

export function AddressList({ addresses }: { addresses: AddressView[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function setDefault(id: string) {
    startTransition(async () => {
      await setDefaultAddressAction(id);
      router.refresh();
    });
  }

  function remove(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await deleteAddressAction(id);
      if (!res.ok) setError(res.error ?? "Could not delete address.");
      else router.refresh();
    });
  }

  if (addresses.length === 0) {
    return (
      <div
        data-testid="no-addresses"
        className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-hairline-strong bg-surface p-8 text-center"
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-muted">
          <MapPin className="h-6 w-6" />
        </span>
        <p className="text-sm font-medium text-ink">No saved addresses yet</p>
        <p className="text-xs text-muted">Add one below so checkout is faster next time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-accent">{error}</p>}
      {addresses.map((a) => (
        <div
          key={a.id}
          data-testid="address-item"
          className={`rounded-xl border bg-surface p-4 shadow-sm transition-colors ${
            a.isDefault ? "border-accent/40 ring-1 ring-accent/20" : "border-hairline"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                a.isDefault ? "bg-accent/10 text-accent" : "bg-surface-2 text-muted"
              }`}
            >
              <MapPin className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-ink">{a.fullName}</span>
                {a.isDefault && (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                    Default
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                <Phone className="h-3.5 w-3.5 shrink-0" /> {a.phone}
              </div>
              <div className="mt-0.5 text-sm leading-relaxed text-muted">
                {[a.line1, a.line2, a.area, a.city, a.postcode].filter(Boolean).join(", ")}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-hairline pt-3">
            {!a.isDefault && (
              <button
                type="button"
                disabled={pending}
                onClick={() => setDefault(a.id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-hairline-strong px-3 py-1.5 text-xs font-medium text-ink hover:border-accent hover:text-accent disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" /> Set as default
              </button>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => remove(a.id)}
              data-testid="address-delete"
              className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/5 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
