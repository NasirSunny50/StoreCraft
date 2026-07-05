"use client";

import { useActionState } from "react";
import {
  updateShippingFeeAction,
  type SettingsFormState,
} from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";

export function ShippingFeeForm({ current }: { current: string }) {
  const [state, formAction, pending] = useActionState<SettingsFormState, FormData>(
    updateShippingFeeAction,
    null,
  );
  const fe = state?.fieldErrors;

  return (
    <form action={formAction} data-testid="shipping-fee-form" className="space-y-3">
      <div className="space-y-1">
        <label htmlFor="shippingFee" className="block text-sm font-medium text-ink">
          Delivery charge (৳)
        </label>
        <input
          id="shippingFee"
          name="shippingFee"
          type="text"
          inputMode="decimal"
          defaultValue={current}
          data-testid="shipping-fee-input"
          className="w-full max-w-[220px] rounded border border-hairline-strong px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <p className="text-xs text-muted">
          Applied to new orders and the checkout total. Past orders keep the fee
          they were placed with.
        </p>
        {fe?.shippingFee && <p className="text-xs text-accent">{fe.shippingFee[0]}</p>}
      </div>

      {state?.ok && (
        <p data-testid="shipping-fee-saved" className="text-sm text-green-700">
          Delivery charge updated.
        </p>
      )}
      {state?.error && <p className="text-sm text-accent">{state.error}</p>}

      <Button type="submit" variant="navy" size="sm" loading={pending} data-testid="shipping-fee-save">
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
