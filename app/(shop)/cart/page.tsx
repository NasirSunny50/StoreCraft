import Link from "next/link";
import { ChevronRight, ShoppingCart } from "lucide-react";
import { getCart, liveCartItems, cartSubtotal } from "@/lib/cart";
import { formatBDT, multiply } from "@/lib/utils/money";
import { CartItemRow, type CartItemView } from "@/components/cart/cart-item-row";

export const metadata = { title: "Cart" };

export default async function CartPage() {
  const cart = await getCart();
  const items = liveCartItems(cart);

  if (items.length === 0) {
    return (
      <div className="space-y-4 py-16 text-center" data-testid="cart-empty">
        <ShoppingCart className="mx-auto h-12 w-12 text-muted" strokeWidth={1.25} />
        <h1 className="text-2xl font-bold text-ink">Your cart is empty</h1>
        <p className="text-muted">Browse our catalog to add items.</p>
        <Link
          href="/products"
          className="inline-block rounded-full bg-accent px-8 py-2.5 font-medium text-white hover:bg-accent-strong"
        >
          Shop products
        </Link>
      </div>
    );
  }

  const views: CartItemView[] = items.map((i) => ({
    productId: i.productId,
    name: i.product.name,
    slug: i.product.slug,
    imageUrl: i.product.images[0]?.url ?? null,
    priceFormatted: formatBDT(i.product.price),
    lineTotalFormatted: formatBDT(multiply(i.product.price, i.quantity)),
    quantity: i.quantity,
    stock: i.product.stock,
    color: i.color,
  }));

  const subtotal = cartSubtotal(cart);

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-2 flex items-center gap-1 text-xs text-muted">
        <Link href="/" className="hover:text-accent">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-ink">Cart</span>
      </nav>

      <h1 className="text-2xl font-bold text-ink md:text-3xl">Your Cart</h1>
      <p className="mb-4 mt-1 text-sm text-muted">
        <span className="font-semibold text-ink">{views.length}</span>{" "}
        {views.length === 1 ? "Item" : "Items"}
      </p>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px] lg:gap-6">
        <div className="space-y-3">
          {views.map((v) => (
            <CartItemRow key={v.productId} item={v} />
          ))}
        </div>

        <aside className="h-fit rounded-lg border border-hairline bg-surface lg:sticky lg:top-32">
          <div className="border-b border-hairline px-4 py-3">
            <h2 className="text-base font-bold text-ink">Order Summary</h2>
          </div>
          <div className="space-y-2.5 px-4 py-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">
                Sub Total ({views.length} {views.length === 1 ? "item" : "items"})
              </span>
              <span data-testid="cart-subtotal" className="font-medium text-ink">
                {formatBDT(subtotal)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Delivery</span>
              <span className="text-muted">Calculated at checkout</span>
            </div>
            <div className="flex justify-between border-t border-hairline pt-3 text-base font-bold">
              <span className="text-ink">Total Amount</span>
              <span className="text-accent">{formatBDT(subtotal)}</span>
            </div>
          </div>
          <div className="px-4 pb-4">
            <Link
              href="/checkout"
              data-testid="checkout-button"
              className="block w-full rounded-full bg-accent px-4 py-3 text-center font-semibold text-white hover:bg-accent-strong"
            >
              Proceed to Checkout
            </Link>
            <Link
              href="/products"
              className="mt-2 block w-full rounded-full border border-hairline-strong px-4 py-2.5 text-center text-sm font-medium text-ink hover:bg-surface-2"
            >
              Continue Shopping
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
