"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthFormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    loginAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
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

      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-ink">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="w-full rounded border border-hairline-strong bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
        {state?.fieldErrors?.email && (
          <p className="text-sm text-accent">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium text-ink">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Your password"
          className="w-full rounded border border-hairline-strong bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
        {state?.fieldErrors?.password && (
          <p className="text-sm text-accent">{state.fieldErrors.password[0]}</p>
        )}
      </div>

      <Button
        type="submit"
        variant="accent"
        size="lg"
        loading={pending}
        className="w-full rounded-full"
      >
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-muted">
        No account?{" "}
        <Link
          href={callbackUrl ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/register"}
          className="font-medium text-link hover:text-accent"
        >
          Register
        </Link>
      </p>
    </form>
  );
}
