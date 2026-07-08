"use client";

import Link from "next/link";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { BuyNowButton } from "@/components/cart/buy-now-button";
import { CardWishlistButton } from "@/components/wishlist/card-wishlist-button";
import { StarRating } from "@/components/product/star-rating";
import type { ProductCardData } from "@/lib/view/product-card-data";

export function ProductCard({ product }: { product: ProductCardData }) {
  const href = `/products/${product.slug}`;
  const soldOut = product.stock <= 0;

  return (
    <div
      data-testid="product-card"
      data-slug={product.slug}
      className="group relative flex flex-col rounded border border-hairline bg-surface transition-all hover:border-accent hover:shadow-card-hover"
    >
      <CardWishlistButton productId={product.id} />

      <Link href={href} className="block">
        <div className="grid aspect-square place-items-center p-4">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.imageAlt}
              loading="lazy"
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="meta-label">No image</span>
          )}
          {soldOut && (
            <span className="absolute left-2 top-2 rounded bg-ink/80 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
              Stock Out
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 border-t border-hairline p-3">
        <Link
          href={href}
          className="line-clamp-2 min-h-[2.75rem] text-[15px] font-semibold leading-snug text-ink hover:text-accent"
        >
          {product.name}
        </Link>

        {product.specBullets.length > 0 && (
          <ul className="space-y-0.5 text-[13px] leading-snug text-muted">
            {product.specBullets.slice(0, 3).map((s, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="text-hairline-strong">▪</span>
                <span className="line-clamp-1">{s}</span>
              </li>
            ))}
          </ul>
        )}

        {product.ratingCount > 0 && (
          <StarRating value={product.ratingAvg} count={product.ratingCount} />
        )}

        <div className="mt-1">
          {product.comparePriceFormatted && (
            <div className="text-[11px] text-muted">
              Regular{" "}
              <span className="line-through">{product.comparePriceFormatted}</span>
            </div>
          )}
          <div
            data-testid="product-price"
            className="text-lg font-bold text-accent"
          >
            {product.priceFormatted}
          </div>
        </div>

        <div className="mt-auto pt-1">
          {soldOut ? (
            <AddToCartButton productId={product.id} stock={product.stock} size="sm" />
          ) : (
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              <AddToCartButton productId={product.id} stock={product.stock} size="sm" />
              <BuyNowButton productId={product.id} stock={product.stock} size="sm" className="w-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
