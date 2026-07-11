"use client";

import { useActionState } from "react";
import { updateProfileAction, type AuthFormState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

const inputCls =
  "w-full rounded border border-hairline-strong bg-surface px-3 py-2 text-sm outline-none focus:border-accent";

export function ProfileForm({
  name,
  phone,
  email,
}: {
  name: string;
  phone: string;
  email: string;
}) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    updateProfileAction,
    null,
  );
  const fe = state?.fieldErrors;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state?.error && (
        <p data-testid="profile-error" role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-accent">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p data-testid="profile-success" role="status" className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">
          {state.success}
        </p>
      )}

      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm font-medium text-ink">Full name</label>
        <input id="name" name="name" type="text" defaultValue={name} required className={inputCls} />
        {fe?.name && <p className="text-sm text-accent">{fe.name[0]}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="phone" className="block text-sm font-medium text-ink">
          Mobile number <span className="ml-1 text-xs font-normal text-muted">(cannot be changed)</span>
        </label>
        <input
          id="phone"
          value={phone}
          disabled
          data-testid="profile-phone"
          className="w-full cursor-not-allowed rounded border border-hairline bg-surface-2 px-3 py-2 text-sm text-muted"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-ink">
          Email <span className="ml-1 text-xs font-normal text-muted">(optional)</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={email}
          data-testid="profile-email"
          placeholder="you@example.com"
          className={inputCls}
        />
        <p className="text-xs text-muted">
          {email
            ? "You’ll receive order updates by email. Clear this field to stop email updates."
            : "Add an email to start receiving order updates by email."}
        </p>
        {fe?.email && <p className="text-sm text-accent">{fe.email[0]}</p>}
      </div>

      <Button type="submit" variant="accent" loading={pending} data-testid="profile-save">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
