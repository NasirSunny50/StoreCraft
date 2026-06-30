"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserBlocked } from "@/lib/actions/admin-customer";
import { Button } from "@/components/ui/button";

export function CustomerBlockButton({
  userId,
  blocked,
}: {
  userId: string;
  blocked: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    setError(null);
    startTransition(async () => {
      const res = await setUserBlocked(userId, !blocked);
      if (!res.ok) setError(res.error ?? "Failed.");
      else router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={blocked ? "soft" : "outline"}
        size="sm"
        disabled={pending}
        data-testid="block-toggle"
        onClick={toggle}
      >
        {blocked ? "Unblock" : "Block"}
      </Button>
      {error && <span className="text-xs text-accent">{error}</span>}
    </div>
  );
}
