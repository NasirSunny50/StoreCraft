import Link from "next/link";
import { ArrowLeft, ShoppingCart, PackageCheck } from "lucide-react";
import { requireAuth } from "@/lib/auth-guard";
import { getCart, liveCartItems, cartSubtotal } from "@/lib/cart";
import { getUserAddresses } from "@/lib/queries/address";
import { sslcommerzConfigured } from "@/lib/sslcommerz";
import { computeOrderTotals, SHIPPING_FEE } from "@/lib/order-math";
import { formatBDT, multiply } from "@/lib/utils/money";
import {
  CheckoutForm,
  type AddressView,
  type SummaryView,
} from "@/components/checkout/checkout-form";
import { AddressForm } from "@/components/checkout/address-form";

export const metadata = { title: "Checkout — StoreCraft" };

export default async function CheckoutPage() {
  const session = await requireAuth();
  const cart = await getCart();
  const items = liveCartItems(cart);

  if (items.length === 0) {
    return (
      <div className="space-y-4 py-16 text-center" data-testid="checkout-empty">
        <ShoppingCart className="mx-auto h-12 w-12 text-muted" strokeWidth={1.25} />
        <h1 className="text-xl font-bold text-ink">Your cart is empty</h1>
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
  const summary: SummaryView = {
    items: items.map((i) => ({
      id: i.id,
      name: i.product.name,
      quantity: i.quantity,
      lineTotal: formatBDT(multiply(i.product.price, i.quantity)),
    })),
    itemCount: items.length,
    subtotal: formatBDT(totals.subtotal),
    shipping: formatBDT(totals.shippingFee),
    total: formatBDT(totals.total),
  };

  return (
    <div>
      {/* Progress steps */}
      <div className="mb-4 flex items-center justify-center gap-3 rounded-lg bg-navbar px-4 py-3 text-xs font-medium text-white">
        <span className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-accent">
            <ShoppingCart className="h-3.5 w-3.5" />
          </span>
          Checkout
        </span>
        <span className="h-px w-16 bg-white/30 sm:w-32" />
        <span className="flex items-center gap-2 text-white/50">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15">
            <PackageCheck className="h-3.5 w-3.5" />
          </span>
          Order Complete
        </span>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/cart"
          className="flex items-center gap-1 rounded-full border border-hairline-strong px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>
        <h1 className="text-xl font-bold text-ink md:text-2xl">Checkout &amp; Confirm Order</h1>
      </div>

      {addressViews.length > 0 ? (
        <CheckoutForm addresses={addressViews} summary={summary} onlineEnabled={sslcommerzConfigured()} />
      ) : (
        <div className="max-w-2xl rounded-lg border border-hairline bg-surface p-4">
          <p className="mb-3 text-sm text-muted" data-testid="checkout-no-address">
            Add a delivery address to continue.
          </p>
          <AddressForm />
        </div>
      )}
    </div>
  );
}
