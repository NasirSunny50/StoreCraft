import Link from "next/link";
import { getCart, liveCartItems, cartSubtotal } from "@/lib/cart";
import { formatBDT, multiply } from "@/lib/utils/money";
import { CartItemRow, type CartItemView } from "@/components/cart/cart-item-row";

export const metadata = { title: "Cart — StoreCraft" };

export default async function CartPage() {
  const cart = await getCart();
  const items = liveCartItems(cart);

  if (items.length === 0) {
    return (
      <div className="space-y-4 py-12 text-center" data-testid="cart-empty">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="text-gray-500">Browse our catalog to add items.</p>
        <Link
          href="/products"
          className="inline-block rounded bg-accent px-6 py-2 font-medium text-white hover:bg-accent-strong"
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Your Cart</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          {views.map((v) => (
            <CartItemRow key={v.productId} item={v} />
          ))}
        </div>

        <aside className="h-fit space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="text-lg font-bold">Order summary</h2>
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span data-testid="cart-subtotal" className="font-bold">
              {formatBDT(subtotal)}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Shipping & taxes calculated at checkout.
          </p>
          <Link
            href="/checkout"
            data-testid="checkout-button"
            className="block w-full rounded bg-accent px-4 py-2.5 text-center font-medium text-white hover:bg-accent-strong"
          >
            Proceed to Checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}
