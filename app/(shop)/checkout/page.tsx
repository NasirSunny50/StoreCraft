import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShoppingCart, PackageCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCart, liveCartItems, cartSubtotal } from "@/lib/cart";
import { getUserAddresses } from "@/lib/queries/address";
import { sslcommerzConfigured } from "@/lib/sslcommerz";
import { getDeliveryFees } from "@/lib/settings";
import { formatBDT, multiply } from "@/lib/utils/money";
import {
  CheckoutForm,
  type AddressView,
  type SummaryView,
} from "@/components/checkout/checkout-form";
import { GuestCheckoutForm } from "@/components/checkout/guest-checkout-form";
import { AddressForm } from "@/components/checkout/address-form";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ guest?: string }>;
}) {
  const session = await auth();
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

  const user = session?.user;
  const { guest } = await searchParams;
  // Gate guests through the login page first; they land back here with ?guest=1
  // after choosing "Continue as guest".
  if (!user && guest !== "1") {
    redirect("/login?callbackUrl=/checkout");
  }
  const addresses = user ? await getUserAddresses(user.id) : [];
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
  const fees = await getDeliveryFees();
  const summary: SummaryView = {
    items: items.map((i) => ({
      id: i.id,
      name: i.product.name,
      quantity: i.quantity,
      lineTotal: formatBDT(multiply(i.product.price, i.quantity)),
    })),
    itemCount: items.length,
    subtotalValue: subtotal.toNumber(),
  };
  const deliveryFees = {
    insideDhaka: Number(fees.insideDhaka),
    outsideDhaka: Number(fees.outsideDhaka),
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

      {!user && (
        <div
          data-testid="guest-signin-nudge"
          className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-hairline bg-surface-2 px-4 py-3 text-sm"
        >
          <span className="text-muted">You&apos;re checking out as a guest.</span>
          <Link
            href="/login?callbackUrl=/checkout"
            className="rounded-full border border-hairline-strong bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:border-accent hover:text-accent"
          >
            Sign in instead
          </Link>
        </div>
      )}

      {!user ? (
        <GuestCheckoutForm
          summary={summary}
          deliveryFees={deliveryFees}
          onlineEnabled={sslcommerzConfigured()}
        />
      ) : addressViews.length > 0 ? (
        <CheckoutForm
          addresses={addressViews}
          summary={summary}
          deliveryFees={deliveryFees}
          onlineEnabled={sslcommerzConfigured()}
          defaultFullName={user.name ?? undefined}
        />
      ) : (
        <div className="max-w-2xl rounded-lg border border-hairline bg-surface p-4">
          <p className="mb-3 text-sm text-muted" data-testid="checkout-no-address">
            Add a delivery address to continue.
          </p>
          <AddressForm defaultFullName={user.name ?? undefined} />
        </div>
      )}
    </div>
  );
}
