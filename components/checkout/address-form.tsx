"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createAddressAction,
  type AddressFormState,
} from "@/lib/actions/address";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { BD_CITIES, areasForCity } from "@/lib/data/bd-locations";

const inputCls =
  "w-full rounded-lg border border-hairline-strong bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20";
const labelCls = "block text-xs font-medium text-ink";

function Field({
  name,
  label,
  required,
  errors,
  type = "text",
  defaultValue,
  placeholder,
}: {
  name: string;
  label: string;
  required?: boolean;
  errors?: string[];
  type?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className={labelCls}>
        {label} {required && <span className="text-accent">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        data-testid={`addr-${name}`}
        className={inputCls}
      />
      {errors?.[0] && <p className="text-xs text-accent">{errors[0]}</p>}
    </div>
  );
}

function SelectField({
  name,
  label,
  required,
  errors,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  name: string;
  label: string;
  required?: boolean;
  errors?: string[];
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className={labelCls}>
        {label} {required && <span className="text-accent">*</span>}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        data-testid={`addr-${name}`}
        className={`${inputCls} disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {errors?.[0] && <p className="text-xs text-accent">{errors[0]}</p>}
    </div>
  );
}

export function AddressForm({
  defaultFullName,
}: {
  /** Prefill the name field (from the account) so customers don't retype it. */
  defaultFullName?: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<AddressFormState, FormData>(
    createAddressAction,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      setCity("");
      setArea("");
      router.refresh();
    }
  }, [state, router]);

  const fe = state?.fieldErrors;

  return (
    <form
      ref={formRef}
      action={formAction}
      data-testid="address-form"
      className="@container space-y-4"
    >
      {/* Columns respond to the FORM's width (container query), not the viewport
          — so the narrow "Add address" panel stacks instead of cramming. */}
      <div className="grid gap-4 @md:grid-cols-2">
        <Field name="fullName" label="Full name" required errors={fe?.fullName} defaultValue={defaultFullName} placeholder="Recipient name" />
        <div className="space-y-1.5">
          <label htmlFor="addr-phone" className={labelCls}>
            Phone <span className="text-accent">*</span>
          </label>
          <PhoneInput name="phone" id="addr-phone" required testId="addr-phone" />
          {fe?.phone?.[0] && <p className="text-xs text-accent">{fe.phone[0]}</p>}
        </div>
      </div>
      <Field name="line1" label="Address line 1" required errors={fe?.line1} placeholder="House, road, block" />
      <Field name="line2" label="Address line 2" errors={fe?.line2} placeholder="Apartment, landmark (optional)" />
      <div className="grid gap-4 @lg:grid-cols-3">
        <SelectField
          name="city"
          label="City"
          required
          errors={fe?.city}
          value={city}
          onChange={(v) => {
            setCity(v);
            setArea(""); // area depends on city — reset it
          }}
          options={BD_CITIES}
          placeholder="Select city"
        />
        <SelectField
          name="area"
          label="Area"
          required
          errors={fe?.area}
          value={area}
          onChange={setArea}
          options={areasForCity(city)}
          placeholder={city ? "Select area" : "Select a city first"}
          disabled={!city}
        />
        <Field name="postcode" label="Postcode" errors={fe?.postcode} placeholder="e.g. 1207" />
      </div>
      <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-hairline bg-surface-2 px-3 py-2.5 text-sm text-ink">
        <input name="isDefault" type="checkbox" data-testid="addr-default" className="h-4 w-4 accent-accent" />
        Set as default address
      </label>
      {state?.error && <p className="text-xs text-accent">{state.error}</p>}
      <Button type="submit" variant="accent" disabled={pending} data-testid="addr-save" className="w-full rounded-lg">
        {pending ? "Saving…" : "Save address"}
      </Button>
    </form>
  );
}
