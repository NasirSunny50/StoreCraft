"use client";

import { useActionState } from "react";
import {
  updateDeliveryFeesAction,
  type SettingsFormState,
} from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";

function FeeField({
  name,
  label,
  hint,
  defaultValue,
  error,
}: {
  name: string;
  label: string;
  hint: string;
  defaultValue: string;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-ink">
        {label} (৳)
      </label>
      <input
        id={name}
        name={name}
        type="text"
        inputMode="decimal"
        defaultValue={defaultValue}
        data-testid={`fee-${name}`}
        className="w-full max-w-[220px] rounded border border-hairline-strong px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <p className="text-xs text-muted">{hint}</p>
      {error && <p className="text-xs text-accent">{error}</p>}
    </div>
  );
}

export function DeliveryFeesForm({
  insideDhaka,
  outsideDhaka,
}: {
  insideDhaka: string;
  outsideDhaka: string;
}) {
  const [state, formAction, pending] = useActionState<SettingsFormState, FormData>(
    updateDeliveryFeesAction,
    null,
  );
  const fe = state?.fieldErrors;

  return (
    <form action={formAction} data-testid="delivery-fees-form" className="space-y-4">
      <FeeField
        name="insideDhaka"
        label="Inside Dhaka"
        hint="Charged when the delivery city is Dhaka."
        defaultValue={insideDhaka}
        error={fe?.insideDhaka?.[0]}
      />
      <FeeField
        name="outsideDhaka"
        label="Outside Dhaka"
        hint="Charged for any other city."
        defaultValue={outsideDhaka}
        error={fe?.outsideDhaka?.[0]}
      />

      {state?.ok && (
        <p data-testid="delivery-fees-saved" className="text-sm text-green-700">
          Delivery charges updated.
        </p>
      )}
      {state?.error && <p className="text-sm text-accent">{state.error}</p>}

      <Button type="submit" variant="navy" size="sm" loading={pending} data-testid="delivery-fees-save">
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
