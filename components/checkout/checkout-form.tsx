"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { placeOrderAction, type PlaceOrderState } from "@/lib/actions/order";
import { previewCoupon } from "@/lib/actions/coupon";
import { Button } from "@/components/ui/button";
import { AddressForm } from "@/components/checkout/address-form";

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

export type SummaryView = {
  items: { id: string; name: string; quantity: number; lineTotal: string }[];
  itemCount: number;
  subtotalValue: number;
};

export type DeliveryFees = { insideDhaka: number; outsideDhaka: number };

const FORM_ID = "checkout-form-el";
const DHAKA_CITY = "Dhaka";

/** Client-side display formatter (server-side order math stays Decimal-safe). */
function taka(n: number): string {
  const [whole, dec] = Math.max(0, n).toFixed(2).split(".");
  return `৳${whole!.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${dec}`;
}

export function CheckoutForm({
  addresses,
  summary,
  deliveryFees,
  onlineEnabled = false,
  defaultFullName,
}: {
  addresses: AddressView[];
  summary: SummaryView;
  deliveryFees: DeliveryFees;
  onlineEnabled?: boolean;
  defaultFullName?: string;
}) {
  const [state, formAction, pending] = useActionState<PlaceOrderState, FormData>(
    placeOrderAction,
    null,
  );

  const [method, setMethod] = useState<"COD" | "SSLCOMMERZ">("COD");
  const [redirecting, setRedirecting] = useState(false);

  // Online payment: the action returns the gateway URL; send the browser there.
  useEffect(() => {
    if (state?.redirectUrl) {
      setRedirecting(true);
      window.location.href = state.redirectUrl;
    }
  }, [state]);

  const [couponInput, setCouponInput] = useState("");
  const [applied, setApplied] = useState<{ code: string; discount: string; discountValue: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponPending, startCoupon] = useTransition();

  function applyCoupon() {
    setCouponError(null);
    startCoupon(async () => {
      const res = await previewCoupon(couponInput);
      if (res.ok) {
        setApplied({ code: res.code, discount: res.discount, discountValue: Number(res.discountValue) });
        setCouponInput(res.code);
      } else {
        setApplied(null);
        setCouponError(res.error);
      }
    });
  }

  const defaultId =
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "";

  // Delivery charge follows the selected address's city (Inside vs Outside Dhaka).
  const [selectedId, setSelectedId] = useState(defaultId);
  const selectedCity = addresses.find((a) => a.id === selectedId)?.city ?? "";
  const insideDhaka = selectedCity.trim() === DHAKA_CITY;
  const shippingFee = insideDhaka ? deliveryFees.insideDhaka : deliveryFees.outsideDhaka;
  const discountValue = applied?.discountValue ?? 0;
  const totalValue = Math.max(0, summary.subtotalValue + shippingFee - discountValue);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:gap-6">
      {/* Left column */}
      <div className="space-y-4">
        <form id={FORM_ID} action={formAction} data-testid="checkout-form" className="space-y-4">
          <section className="rounded-lg border border-hairline bg-surface p-4">
            <h2 className="mb-3 text-base font-bold text-ink">Delivery Address</h2>
            <div className="space-y-2">
              {addresses.map((a) => (
                <label
                  key={a.id}
                  className="flex cursor-pointer gap-3 rounded-lg border border-hairline bg-surface p-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/5"
                >
                  <input
                    type="radio"
                    name="addressId"
                    value={a.id}
                    checked={a.id === selectedId}
                    onChange={() => setSelectedId(a.id)}
                    data-testid="checkout-address"
                    className="mt-1 accent-accent"
                  />
                  <span>
                    <span className="font-medium text-ink">{a.fullName}</span>
                    {a.isDefault && (
                      <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-muted">
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

          <section className="rounded-lg border border-hairline bg-surface p-4">
            <h2 className="mb-3 text-base font-bold text-ink">Payment Method</h2>
            <div className="space-y-2">
              <label className="flex items-center gap-2 rounded-lg border border-hairline p-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/5">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={method === "COD"}
                  onChange={() => setMethod("COD")}
                  className="accent-accent"
                />
                <span className="font-medium text-ink">Cash on Delivery (COD)</span>
              </label>
              {onlineEnabled && (
                <label
                  className="flex items-center gap-2 rounded-lg border border-hairline p-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent/5"
                  data-testid="pay-online"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="SSLCOMMERZ"
                    checked={method === "SSLCOMMERZ"}
                    onChange={() => setMethod("SSLCOMMERZ")}
                    className="accent-accent"
                  />
                  <span className="font-medium text-ink">
                    Online Payment{" "}
                    <span className="font-normal text-muted">
                      — bKash · Nagad · Rocket · Upay · Visa · Mastercard · American Express · Internet Banking (SSLCommerz)
                    </span>
                  </span>
                </label>
              )}
            </div>
            <p className="mt-2 text-xs text-muted">
              {method === "COD"
                ? "Pay in cash when your order arrives."
                : "You'll be redirected to SSLCommerz to pay securely with mobile banking (bKash, Nagad, Rocket, Upay), any Visa/Mastercard/Amex card, or internet banking — then back to your order."}
            </p>
          </section>

          <section className="rounded-lg border border-hairline bg-surface p-4">
            <h2 className="mb-3 text-base font-bold text-ink">Order Note (optional)</h2>
            <textarea
              name="note"
              rows={2}
              data-testid="checkout-note"
              placeholder="For example: Leave the parcel with the neighbor if not available…"
              className="w-full rounded border border-hairline-strong px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </section>
        </form>

        {/* Separate form — must stay outside the checkout <form> element. */}
        <details className="rounded-lg border border-hairline bg-surface p-4">
          <summary className="cursor-pointer text-sm font-medium text-link">
            + Add a new address
          </summary>
          <div className="mt-3">
            <AddressForm defaultFullName={defaultFullName} />
          </div>
        </details>
      </div>

      {/* Order Summary (controls join the form via the form attribute) */}
      <aside className="h-fit rounded-lg border border-hairline bg-surface lg:sticky lg:top-32">
        <div className="border-b border-hairline px-4 py-3">
          <h2 className="text-base font-bold text-ink">Order Summary</h2>
        </div>

        <div className="divide-y divide-hairline px-4">
          {summary.items.map((i) => (
            <div key={i.id} className="flex justify-between gap-3 py-3 text-sm">
              <span className="text-ink">
                {i.name}
                <span className="text-muted"> × {i.quantity}</span>
              </span>
              <span className="whitespace-nowrap font-medium">{i.lineTotal}</span>
            </div>
          ))}
        </div>

        {/* Coupon */}
        <div className="border-t border-hairline px-4 py-4">
          <span className="mb-2 block text-sm font-semibold text-ink">Apply Coupon</span>
          <input type="hidden" name="couponCode" value={applied?.code ?? ""} form={FORM_ID} />
          <div className="flex gap-2">
            <input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="Coupon code"
              data-testid="coupon-input"
              className="min-w-0 flex-1 rounded-full border border-hairline-strong px-4 py-2 text-sm uppercase outline-none focus:border-accent"
            />
            <Button
              type="button"
              variant="navy"
              loading={couponPending}
              disabled={!couponInput.trim()}
              data-testid="coupon-apply"
              onClick={applyCoupon}
              className="rounded-full"
            >
              Apply
            </Button>
          </div>
          {applied && (
            <p data-testid="coupon-applied" className="mt-2 text-sm text-green-700">
              Coupon <strong>{applied.code}</strong> applied — discount {applied.discount}. New total {taka(totalValue)}.
            </p>
          )}
          {couponError && (
            <p data-testid="coupon-error" className="mt-2 text-sm text-accent">{couponError}</p>
          )}
        </div>

        {/* Totals */}
        <div className="space-y-2.5 border-t border-hairline px-4 py-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Sub Total ({summary.itemCount} {summary.itemCount === 1 ? "item" : "items"})</span>
            <span data-testid="summary-subtotal" className="font-medium">{taka(summary.subtotalValue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">
              Delivery <span className="text-xs">({insideDhaka ? "Inside Dhaka" : "Outside Dhaka"})</span>
            </span>
            <span data-testid="summary-shipping" className="font-medium">{taka(shippingFee)}</span>
          </div>
          {applied && (
            <div className="flex justify-between">
              <span className="text-muted">Discount ({applied.code})</span>
              <span className="font-medium text-green-700">− {applied.discount}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-hairline pt-3 text-base font-bold">
            <span className="text-ink">Total Amount</span>
            <span data-testid="summary-total" className="text-accent">
              {taka(totalValue)}
            </span>
          </div>
        </div>

        <div className="px-4 pb-4">
          {state?.error && (
            <p data-testid="checkout-error" className="mb-2 rounded bg-red-50 px-3 py-2 text-sm text-accent">
              {state.error}
            </p>
          )}
          <Button
            type="submit"
            form={FORM_ID}
            variant="accent"
            size="lg"
            loading={pending || redirecting}
            data-testid="place-order"
            className="w-full rounded-full"
          >
            {pending || redirecting
              ? method === "SSLCOMMERZ"
                ? "Redirecting to payment…"
                : "Placing order…"
              : method === "SSLCOMMERZ"
                ? "Proceed to Payment"
                : "Confirm & Place Order"}
          </Button>
        </div>
      </aside>
    </div>
  );
}
