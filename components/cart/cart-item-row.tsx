"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateCartItemAction,
  removeCartItemAction,
} from "@/lib/actions/cart";

export type CartItemView = {
  productId: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  priceFormatted: string;
  lineTotalFormatted: string;
  quantity: number;
  stock: number;
};

export function CartItemRow({ item }: { item: CartItemView }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setQty(qty: number) {
    startTransition(async () => {
      await updateCartItemAction(item.productId, qty);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await removeCartItemAction(item.productId);
      router.refresh();
    });
  }

  return (
    <div
      data-testid="cart-item"
      data-slug={item.slug}
      className="flex items-center gap-4 border-b border-gray-200 py-4 dark:border-gray-800"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-gray-100 dark:bg-gray-900">
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <Link href={`/products/${item.slug}`} className="font-medium hover:underline">
          {item.name}
        </Link>
        <p className="text-sm text-gray-500">{item.priceFormatted} each</p>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Decrease quantity"
          data-testid="qty-decrease"
          disabled={pending}
          onClick={() => setQty(item.quantity - 1)}
          className="h-8 w-8 rounded border border-gray-300 disabled:opacity-50 dark:border-gray-700"
        >
          −
        </button>
        <span data-testid="cart-qty" className="w-8 text-center">
          {item.quantity}
        </span>
        <button
          type="button"
          aria-label="Increase quantity"
          data-testid="qty-increase"
          disabled={pending || item.quantity >= item.stock}
          onClick={() => setQty(item.quantity + 1)}
          className="h-8 w-8 rounded border border-gray-300 disabled:opacity-50 dark:border-gray-700"
        >
          +
        </button>
      </div>

      <div className="w-24 text-right font-medium" data-testid="line-total">
        {item.lineTotalFormatted}
      </div>

      <button
        type="button"
        onClick={remove}
        disabled={pending}
        data-testid="cart-remove"
        className="text-sm text-red-600 hover:underline disabled:opacity-50"
      >
        Remove
      </button>
    </div>
  );
}
