"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { placeGuestOrderAction, type PlaceOrderState } from "@/lib/actions/order";
import { previewCoupon } from "@/lib/actions/coupon";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { PaymentRedirectOverlay } from "@/components/checkout/payment-redirect-overlay";
import { BD_CITIES, areasForCity } from "@/lib/data/bd-locations";
import type { SummaryView, DeliveryFees } from "@/components/checkout/checkout-form";

const FORM_ID = "guest-checkout-form-el";
const DHAKA_CITY = "Dhaka";

/** Client-side display formatter (server-side order math stays Decimal-safe). */
function taka(n: number): string {
  const [whole, dec] = Math.max(0, n).toFixed(2).split(".");
  return `৳${whole!.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${dec}`;
}

const inputCls =
  "w-full rounded border border-hairline-strong px-3 py-2 text-sm outline-none focus:border-accent";

/** Guest (no-account) checkout — inline shipping details, COD or online payment. */
export function GuestCheckoutForm({
  summary,
  deliveryFees,
  onlineEnabled = false,
}: {
  summary: SummaryView;
  deliveryFees: DeliveryFees;
  onlineEnabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState<PlaceOrderState, FormData>(
    placeGuestOrderAction,
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

  // Delivery charge follows the selected city (Inside vs Outside Dhaka).
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const insideDhaka = city.trim().toLowerCase() === DHAKA_CITY.toLowerCase();
  const shippingFee = insideDhaka ? deliveryFees.insideDhaka : deliveryFees.outsideDhaka;

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

  const discountValue = applied?.discountValue ?? 0;
  const totalValue = Math.max(0, summary.subtotalValue + shippingFee - discountValue);
  const fieldErr = (k: string) => state?.fieldErrors?.[k]?.[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:gap-6">
      {redirecting && <PaymentRedirectOverlay />}
      {/* Left column */}
      <div className="space-y-4">
        <form id={FORM_ID} action={formAction} data-testid="guest-checkout-form" className="space-y-4">
          <section className="rounded-lg border border-hairline bg-surface p-4">
            <h2 className="mb-3 text-base font-bold text-ink">Delivery Details</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name" name="fullName" error={fieldErr("fullName")} required testId="guest-fullname" />
              <div>
                <label htmlFor="guest-phone" className="mb-1 block text-xs font-medium text-muted">
                  Phone number <span className="text-accent">*</span>
                </label>
                <PhoneInput name="phone" id="guest-phone" required testId="guest-phone" />
                {fieldErr("phone") && <p className="mt-1 text-xs text-accent">{fieldErr("phone")}</p>}
              </div>
              <Field label="Address (house, road)" name="line1" error={fieldErr("line1")} required className="sm:col-span-2" testId="guest-line1" />
              <SelectField
                label="City"
                name="city"
                required
                error={fieldErr("city")}
                value={city}
                onChange={(v) => {
                  setCity(v);
                  setArea(""); // area depends on city — reset it
                }}
                options={BD_CITIES}
                placeholder="Select city"
                testId="guest-city"
              />
              <SelectField
                label="Area"
                name="area"
                required
                error={fieldErr("area")}
                value={area}
                onChange={setArea}
                options={areasForCity(city)}
                placeholder={city ? "Select area" : "Select a city first"}
                disabled={!city}
                testId="guest-area"
              />
              <Field label="Postcode (optional)" name="postcode" error={fieldErr("postcode")} />
              <Field label="Email (optional — for order updates)" name="email" error={fieldErr("email")} type="email" className="sm:col-span-2" />
            </div>
            <input type="hidden" name="line2" value="" />
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
                  data-testid="guest-pay-online"
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
                      — bKash · Nagad · Rocket · Upay · Visa · Mastercard · Internet Banking (SSLCommerz)
                    </span>
                  </span>
                </label>
              )}
            </div>
            <p className="mt-2 text-xs text-muted">
              {method === "COD"
                ? "Pay in cash when your order arrives."
                : "You'll be redirected to SSLCommerz to pay securely, then back to your order tracking page."}
            </p>
          </section>

          <section className="rounded-lg border border-hairline bg-surface p-4">
            <h2 className="mb-3 text-base font-bold text-ink">Order Note (optional)</h2>
            <textarea
              name="note"
              rows={2}
              data-testid="guest-note"
              placeholder="For example: Leave the parcel with the neighbor if not available…"
              className={inputCls}
            />
          </section>
        </form>
      </div>

      {/* Order Summary */}
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
              data-testid="guest-coupon-input"
              className="min-w-0 flex-1 rounded-full border border-hairline-strong px-4 py-2 text-sm uppercase outline-none focus:border-accent"
            />
            <Button
              type="button"
              variant="navy"
              loading={couponPending}
              disabled={!couponInput.trim()}
              onClick={applyCoupon}
              className="rounded-full"
            >
              Apply
            </Button>
          </div>
          {applied && (
            <p className="mt-2 text-sm text-green-700">
              Coupon <strong>{applied.code}</strong> applied — discount {applied.discount}.
            </p>
          )}
          {couponError && <p className="mt-2 text-sm text-accent">{couponError}</p>}
        </div>

        {/* Totals */}
        <div className="space-y-2.5 border-t border-hairline px-4 py-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Sub Total ({summary.itemCount} {summary.itemCount === 1 ? "item" : "items"})</span>
            <span className="font-medium">{taka(summary.subtotalValue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">
              Delivery <span className="text-xs">({insideDhaka ? "Inside Dhaka" : "Outside Dhaka"})</span>
            </span>
            <span className="font-medium">{taka(shippingFee)}</span>
          </div>
          {applied && (
            <div className="flex justify-between">
              <span className="text-muted">Discount ({applied.code})</span>
              <span className="font-medium text-green-700">− {applied.discount}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-hairline pt-3 text-base font-bold">
            <span className="text-ink">Total Amount</span>
            <span data-testid="guest-summary-total" className="text-accent">{taka(totalValue)}</span>
          </div>
        </div>

        <div className="px-4 pb-4">
          {state?.error && (
            <p data-testid="guest-checkout-error" className="mb-2 rounded bg-red-50 px-3 py-2 text-sm text-accent">
              {state.error}
            </p>
          )}
          <Button
            type="submit"
            form={FORM_ID}
            variant="accent"
            size="lg"
            loading={pending || redirecting}
            data-testid="guest-place-order"
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

function SelectField({
  label,
  name,
  error,
  required,
  options,
  placeholder,
  disabled,
  className,
  value,
  onChange,
  testId,
}: {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  className?: string;
  value: string;
  onChange: (v: string) => void;
  testId?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={`guest-${name}`} className="mb-1 block text-xs font-medium text-muted">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      <select
        id={`guest-${name}`}
        name={name}
        required={required}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
        className={`${inputCls} bg-surface disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-accent">{error}</p>}
    </div>
  );
}

function Field({
  label,
  name,
  error,
  required,
  placeholder,
  type = "text",
  className,
  value,
  onChange,
  testId,
}: {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  className?: string;
  value?: string;
  onChange?: (v: string) => void;
  testId?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={`guest-${name}`} className="mb-1 block text-xs font-medium text-muted">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      <input
        id={`guest-${name}`}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        data-testid={testId}
        {...(onChange ? { value, onChange: (e) => onChange(e.target.value) } : {})}
        className={inputCls}
      />
      {error && <p className="mt-1 text-xs text-accent">{error}</p>}
    </div>
  );
}
