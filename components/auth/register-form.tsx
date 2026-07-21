"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type AuthFormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";

function Field({
  name,
  label,
  type,
  autoComplete,
  placeholder,
  errors,
  required = true,
  hint,
}: {
  name: string;
  label: string;
  type: string;
  autoComplete: string;
  placeholder?: string;
  errors?: string[];
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-ink">
        {label}
        {!required && <span className="ml-1 text-xs font-normal text-muted">(optional)</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-hairline-strong bg-surface px-3.5 py-2 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
      {hint && <p className="text-xs text-muted">{hint}</p>}
      {errors?.[0] && <p className="text-sm text-accent">{errors[0]}</p>}
    </div>
  );
}

export function RegisterForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    registerAction,
    null,
  );
  const fe = state?.fieldErrors;

  return (
    <form action={formAction} className="space-y-3" noValidate>
      {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
      {state?.error && (
        <p
          data-testid="form-error"
          role="alert"
          className="rounded bg-red-50 px-3 py-2 text-sm text-accent"
        >
          {state.error}
        </p>
      )}

      <Field name="name" label="Full name" type="text" autoComplete="name" placeholder="Your name" errors={fe?.name} />
      <div className="space-y-1">
        <label htmlFor="phone" className="block text-sm font-medium text-ink">Mobile number</label>
        <PhoneInput name="phone" id="phone" required testId="register-phone" />
        {fe?.phone?.[0] && <p className="text-sm text-accent">{fe.phone[0]}</p>}
      </div>
      <Field name="email" label="Email" type="email" autoComplete="email" placeholder="you@example.com" required={false} errors={fe?.email} />
      <div className="grid grid-cols-2 gap-3">
        <Field name="password" label="Password" type="password" autoComplete="new-password" placeholder="Min 6 characters" errors={fe?.password} />
        <Field name="confirmPassword" label="Confirm" type="password" autoComplete="new-password" placeholder="Repeat" errors={fe?.confirmPassword} />
      </div>

      <Button
        type="submit"
        variant="accent"
        size="lg"
        loading={pending}
        className="w-full rounded-full"
      >
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link
          href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"}
          className="font-medium text-link hover:text-accent"
        >
          Login
        </Link>
      </p>
    </form>
  );
}
