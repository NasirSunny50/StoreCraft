"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  moveToCartAction,
  removeFromWishlistAction,
} from "@/lib/actions/wishlist";

export type WishlistItemView = {
  productId: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  priceFormatted: string;
  stock: number;
};

export function WishlistItemRow({ item }: { item: WishlistItemView }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const outOfStock = item.stock <= 0;

  function moveToCart() {
    startTransition(async () => {
      await moveToCartAction(item.productId);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await removeFromWishlistAction(item.productId);
      router.refresh();
    });
  }

  return (
    <div
      data-testid="wishlist-item"
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
        <p className="text-sm text-gray-500">{item.priceFormatted}</p>
      </div>

      <button
        type="button"
        onClick={moveToCart}
        disabled={pending || outOfStock}
        data-testid="move-to-cart"
        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {outOfStock ? "Out of stock" : "Move to cart"}
      </button>

      <button
        type="button"
        onClick={remove}
        disabled={pending}
        data-testid="wishlist-remove"
        className="text-sm text-red-600 hover:underline disabled:opacity-50"
      >
        Remove
      </button>
    </div>
  );
}
