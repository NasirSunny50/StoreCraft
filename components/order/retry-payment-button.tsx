"use client";

import { useState, useTransition } from "react";
import { retryOnlinePaymentAction } from "@/lib/actions/order";
import { Button } from "@/components/ui/button";
import { PaymentRedirectOverlay } from "@/components/checkout/payment-redirect-overlay";

/** "Pay now" for an unpaid online order — re-opens the SSLCommerz gateway. */
export function RetryPaymentButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pay() {
    setError(null);
    startTransition(async () => {
      const res = await retryOnlinePaymentAction(orderId);
      if (res.ok && res.redirectUrl) {
        setRedirecting(true);
        window.location.href = res.redirectUrl;
      } else {
        setError(res.error ?? "Could not start payment. Please try again.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      {redirecting && <PaymentRedirectOverlay />}
      <Button
        type="button"
        variant="accent"
        size="sm"
        data-testid="retry-payment"
        loading={pending || redirecting}
        onClick={pay}
      >
        {pending || redirecting ? "Redirecting to payment…" : "Pay now"}
      </Button>
      {error && (
        <p data-testid="retry-payment-error" className="text-xs text-accent">
          {error}
        </p>
      )}
    </div>
  );
}
