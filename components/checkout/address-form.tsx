"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  createAddressAction,
  type AddressFormState,
} from "@/lib/actions/address";
import { Button } from "@/components/ui/button";

function Field({
  name,
  label,
  required,
  errors,
  type = "text",
  defaultValue,
}: {
  name: string;
  label: string;
  required?: boolean;
  errors?: string[];
  type?: string;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-xs font-medium text-ink">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        data-testid={`addr-${name}`}
        className="w-full rounded border border-hairline-strong px-3 py-2 text-sm outline-none focus:border-accent"
      />
      {errors?.[0] && <p className="text-xs text-accent">{errors[0]}</p>}
    </div>
  );
}

export function AddressForm({
  compact = false,
  defaultFullName,
}: {
  compact?: boolean;
  /** Prefill the name field (from the account) so customers don't retype it. */
  defaultFullName?: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<AddressFormState, FormData>(
    createAddressAction,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  const fe = state?.fieldErrors;

  return (
    <form
      ref={formRef}
      action={formAction}
      data-testid="address-form"
      className="space-y-3"
    >
      <div className={compact ? "grid gap-3" : "grid gap-3 sm:grid-cols-2"}>
        <Field name="fullName" label="Full name" required errors={fe?.fullName} defaultValue={defaultFullName} />
        <Field name="phone" label="Phone" required errors={fe?.phone} />
      </div>
      <Field name="line1" label="Address line 1" required errors={fe?.line1} />
      <Field name="line2" label="Address line 2" errors={fe?.line2} />
      <div className={compact ? "grid gap-3" : "grid gap-3 sm:grid-cols-3"}>
        <Field name="city" label="City" required errors={fe?.city} />
        <Field name="area" label="Area" errors={fe?.area} />
        <Field name="postcode" label="Postcode" errors={fe?.postcode} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input name="isDefault" type="checkbox" data-testid="addr-default" />
        Set as default address
      </label>
      {state?.error && <p className="text-xs text-accent">{state.error}</p>}
      <Button type="submit" variant="navy" size="sm" disabled={pending} data-testid="addr-save">
        {pending ? "Saving…" : "Save address"}
      </Button>
    </form>
  );
}
