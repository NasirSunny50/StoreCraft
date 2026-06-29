"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelOrderAction } from "@/lib/actions/order";
import { Button } from "@/components/ui/button";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  function cancel() {
    setError(null);
    startTransition(async () => {
      const res = await cancelOrderAction(orderId);
      if (!res.ok) setError(res.error ?? "Could not cancel order.");
      else router.refresh();
    });
  }

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-testid="cancel-order"
        onClick={() => setConfirming(true)}
      >
        Cancel order
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-ink">Cancel this order?</p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="accent"
          size="sm"
          data-testid="cancel-order-confirm"
          disabled={pending}
          onClick={cancel}
        >
          {pending ? "Cancelling…" : "Yes, cancel"}
        </Button>
        <Button
          type="button"
          variant="soft"
          size="sm"
          disabled={pending}
          onClick={() => setConfirming(false)}
        >
          Keep order
        </Button>
      </div>
      {error && (
        <p data-testid="cancel-error" className="text-xs text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
