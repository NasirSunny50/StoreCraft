"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
    return <p className="text-sm text-muted" data-testid="no-addresses">No saved addresses yet.</p>;
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-accent">{error}</p>}
      {addresses.map((a) => (
        <div
          key={a.id}
          data-testid="address-item"
          className="flex items-start justify-between gap-4 rounded border border-hairline bg-surface p-4 text-sm"
        >
          <div>
            <div className="font-medium text-ink">
              {a.fullName}
              {a.isDefault && (
                <span className="ml-2 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                  Default
                </span>
              )}
            </div>
            <div className="text-muted">{a.phone}</div>
            <div className="text-muted">
              {[a.line1, a.line2, a.area, a.city, a.postcode]
                .filter(Boolean)
                .join(", ")}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {!a.isDefault && (
              <button
                type="button"
                disabled={pending}
                onClick={() => setDefault(a.id)}
                className="text-xs text-link hover:underline disabled:opacity-50"
              >
                Set default
              </button>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => remove(a.id)}
              data-testid="address-delete"
              className="text-xs text-accent hover:underline disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
