import Link from "next/link";
import { requireAuth } from "@/lib/auth-guard";
import { getCart, liveCartItems, cartSubtotal } from "@/lib/cart";
import { getUserAddresses } from "@/lib/queries/address";
import { computeOrderTotals, SHIPPING_FEE } from "@/lib/order-math";
import { formatBDT, multiply } from "@/lib/utils/money";
import {
  CheckoutForm,
  type AddressView,
} from "@/components/checkout/checkout-form";
import { AddressForm } from "@/components/checkout/address-form";

export const metadata = { title: "Checkout — StoreCraft" };

export default async function CheckoutPage() {
  const session = await requireAuth();
  const cart = await getCart();
  const items = liveCartItems(cart);

  if (items.length === 0) {
    return (
      <div className="space-y-4 py-12 text-center" data-testid="checkout-empty">
        <h1 className="text-xl font-bold">Your cart is empty</h1>
        <Link href="/products" className="text-link hover:underline">
          Continue shopping →
        </Link>
      </div>
    );
  }

  const addresses = await getUserAddresses(session.user.id);
  const addressViews: AddressView[] = addresses.map((a) => ({
    id: a.id,
    fullName: a.fullName,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    area: a.area,
    postcode: a.postcode,
    isDefault: a.isDefault,
  }));

  const subtotal = cartSubtotal(cart);
  const totals = computeOrderTotals({ subtotal, shippingFee: SHIPPING_FEE });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Checkout</h1>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {addressViews.length > 0 ? (
            <div className="rounded border border-hairline bg-surface p-4">
              <CheckoutForm addresses={addressViews} />
            </div>
          ) : (
            <div className="rounded border border-hairline bg-surface p-4">
              <p className="mb-3 text-sm text-muted" data-testid="checkout-no-address">
                Add a delivery address to continue.
              </p>
              <AddressForm />
            </div>
          )}

          {addressViews.length > 0 && (
            <details className="rounded border border-hairline bg-surface p-4">
              <summary className="cursor-pointer text-sm font-medium text-link">
                + Add a new address
              </summary>
              <div className="mt-3">
                <AddressForm />
              </div>
            </details>
          )}
        </div>

        {/* Order summary */}
        <aside className="h-fit rounded border border-hairline bg-surface">
          <div className="border-b border-hairline px-4 py-3">
            <h2 className="text-sm font-bold">Order Summary</h2>
          </div>
          <div className="divide-y divide-hairline px-4">
            {items.map((i) => (
              <div key={i.id} className="flex justify-between gap-3 py-3 text-sm">
                <span className="text-ink">
                  {i.product.name}
                  <span className="text-muted"> × {i.quantity}</span>
                </span>
                <span className="whitespace-nowrap font-medium">
                  {formatBDT(multiply(i.product.price, i.quantity))}
                </span>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 border-t border-hairline px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span data-testid="summary-subtotal">{formatBDT(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Shipping</span>
              <span data-testid="summary-shipping">{formatBDT(totals.shippingFee)}</span>
            </div>
            <div className="flex justify-between border-t border-hairline pt-2 text-base font-bold">
              <span>Total</span>
              <span data-testid="summary-total" className="text-accent">
                {formatBDT(totals.total)}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
