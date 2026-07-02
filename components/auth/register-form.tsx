"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type AuthFormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

function Field({
  name,
  label,
  type,
  autoComplete,
  placeholder,
  errors,
}: {
  name: string;
  label: string;
  type: string;
  autoComplete: string;
  placeholder?: string;
  errors?: string[];
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        placeholder={placeholder}
        className="w-full rounded border border-hairline-strong bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />
      {errors?.[0] && <p className="text-sm text-accent">{errors[0]}</p>}
    </div>
  );
}

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    registerAction,
    null,
  );
  const fe = state?.fieldErrors;

  return (
    <form action={formAction} className="space-y-4" noValidate>
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
      <Field name="email" label="Email" type="email" autoComplete="email" placeholder="you@example.com" errors={fe?.email} />
      <Field name="password" label="Password" type="password" autoComplete="new-password" placeholder="At least 8 characters" errors={fe?.password} />
      <Field name="confirmPassword" label="Confirm password" type="password" autoComplete="new-password" placeholder="Repeat the password" errors={fe?.confirmPassword} />

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
        <Link href="/login" className="font-medium text-link hover:text-accent">
          Login
        </Link>
      </p>
    </form>
  );
}
