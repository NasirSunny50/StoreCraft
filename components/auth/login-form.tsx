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
        <label htmlFor="identifier" className="block text-sm font-medium text-ink">
          Mobile number or email
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          required
          placeholder="01XXXXXXXXX or you@example.com"
          className="w-full rounded border border-hairline-strong bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
        {state?.fieldErrors?.identifier && (
          <p className="text-sm text-accent">{state.fieldErrors.identifier[0]}</p>
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
