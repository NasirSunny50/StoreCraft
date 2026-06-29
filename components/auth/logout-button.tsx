"use client";

import { useTransition } from "react";
import { logoutAction } from "@/lib/actions/auth";

// Rendered inside the dark top utility bar.
export function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      data-testid="logout-button"
      disabled={pending}
      onClick={() => startTransition(() => logoutAction())}
      className="text-white/80 hover:text-white disabled:opacity-50"
    >
      {pending ? "Signing out…" : "Sign Out"}
    </button>
  );
}
