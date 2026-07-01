"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  updateCartItemAction,
  removeCartItemAction,
} from "@/lib/actions/cart";
import { cn } from "@/lib/utils/cn";

export type CartItemView = {
  productId: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  priceFormatted: string;
  lineTotalFormatted: string;
  quantity: number;
  stock: number;
  color: string;
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
      aria-busy={pending || undefined}
      className={cn(
        "flex flex-wrap items-center gap-4 border-b border-hairline py-4 transition-opacity",
        pending && "opacity-60",
      )}
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-surface-2">
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
        )}
      </div>

      <div className="min-w-0 flex-1 basis-40">
        <Link href={`/products/${item.slug}`} className="font-medium hover:underline">
          {item.name}
        </Link>
        {item.color && (
          <p className="text-xs text-muted" data-testid="cart-item-color">Color: {item.color}</p>
        )}
        <p className="text-sm text-muted">{item.priceFormatted} each</p>
      </div>

      {/* Controls wrap to their own full-width row on mobile, inline on sm+. */}
      <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Decrease quantity"
            data-testid="qty-decrease"
            disabled={pending}
            onClick={() => setQty(item.quantity - 1)}
            className="h-8 w-8 rounded border border-hairline-strong disabled:opacity-50"
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
            className="h-8 w-8 rounded border border-hairline-strong disabled:opacity-50"
          >
            +
          </button>
        </div>

        <div
          className="flex w-24 items-center justify-end gap-1.5 font-medium"
          data-testid="line-total"
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" aria-hidden />}
          {item.lineTotalFormatted}
        </div>

        <button
          type="button"
          onClick={remove}
          disabled={pending}
          data-testid="cart-remove"
          className="text-sm text-accent hover:underline disabled:opacity-50"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
