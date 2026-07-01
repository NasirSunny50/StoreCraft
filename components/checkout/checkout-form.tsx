"use client";

import { useActionState, useState, useTransition } from "react";
import { placeOrderAction, type PlaceOrderState } from "@/lib/actions/order";
import { previewCoupon } from "@/lib/actions/coupon";
import { Button } from "@/components/ui/button";

export type AddressView = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  area?: string | null;
  postcode?: string | null;
  isDefault: boolean;
};

export function CheckoutForm({ addresses }: { addresses: AddressView[] }) {
  const [state, formAction, pending] = useActionState<PlaceOrderState, FormData>(
    placeOrderAction,
    null,
  );

  const [couponInput, setCouponInput] = useState("");
  const [applied, setApplied] = useState<{ code: string; discount: string; total: string } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponPending, startCoupon] = useTransition();

  function applyCoupon() {
    setCouponError(null);
    startCoupon(async () => {
      const res = await previewCoupon(couponInput);
      if (res.ok) {
        setApplied({ code: res.code, discount: res.discount, total: res.total });
        setCouponInput(res.code);
      } else {
        setApplied(null);
        setCouponError(res.error);
      }
    });
  }

  const defaultId =
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "";

  return (
    <form action={formAction} className="space-y-5" data-testid="checkout-form">
      <section>
        <h2 className="mb-2 text-sm font-bold text-ink">Delivery Address</h2>
        <div className="space-y-2">
          {addresses.map((a) => (
            <label
              key={a.id}
              className="flex cursor-pointer gap-3 rounded border border-hairline bg-surface p-3 text-sm has-[:checked]:border-accent"
            >
              <input
                type="radio"
                name="addressId"
                value={a.id}
                defaultChecked={a.id === defaultId}
                data-testid="checkout-address"
                className="mt-1"
              />
              <span>
                <span className="font-medium text-ink">{a.fullName}</span>
                {a.isDefault && (
                  <span className="ml-2 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                    Default
                  </span>
                )}
                <span className="block text-muted">{a.phone}</span>
                <span className="block text-muted">
                  {[a.line1, a.line2, a.area, a.city, a.postcode]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </span>
            </label>
          ))}
        </div>
        {state?.fieldErrors?.addressId && (
          <p className="mt-1 text-xs text-accent">
            {state.fieldErrors.addressId[0]}
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-ink">Payment Method</h2>
        <label className="flex items-center gap-2 rounded border border-accent bg-surface p-3 text-sm">
          <input type="radio" name="paymentMethod" value="COD" defaultChecked />
          <span className="font-medium">Cash on Delivery (COD)</span>
        </label>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-ink">Coupon</h2>
        <input type="hidden" name="couponCode" value={applied?.code ?? ""} />
        <div className="flex gap-2">
          <input
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            placeholder="Coupon code"
            data-testid="coupon-input"
            className="w-48 rounded border border-hairline-strong px-3 py-2 text-sm uppercase"
          />
          <Button
            type="button"
            variant="soft"
            loading={couponPending}
            disabled={!couponInput.trim()}
            data-testid="coupon-apply"
            onClick={applyCoupon}
          >
            Apply
          </Button>
        </div>
        {applied && (
          <p data-testid="coupon-applied" className="mt-1 text-sm text-green-700">
            Coupon <strong>{applied.code}</strong> applied — discount {applied.discount}. New total {applied.total}.
          </p>
        )}
        {couponError && (
          <p data-testid="coupon-error" className="mt-1 text-sm text-accent">{couponError}</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-ink">Order Note (optional)</h2>
        <textarea
          name="note"
          rows={2}
          data-testid="checkout-note"
          placeholder="Any special instructions…"
          className="w-full rounded border border-hairline-strong px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </section>

      {state?.error && (
        <p data-testid="checkout-error" className="rounded bg-red-50 px-3 py-2 text-sm text-accent">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        variant="accent"
        size="lg"
        loading={pending}
        data-testid="place-order"
        className="w-full"
      >
        {pending ? "Placing order…" : "Place Order"}
      </Button>
    </form>
  );
}
