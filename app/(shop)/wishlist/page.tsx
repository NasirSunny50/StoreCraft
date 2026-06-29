import Link from "next/link";
import { requireAuth } from "@/lib/auth-guard";
import { getWishlist } from "@/lib/wishlist";
import { formatBDT } from "@/lib/utils/money";
import {
  WishlistItemRow,
  type WishlistItemView,
} from "@/components/wishlist/wishlist-item-row";

export const metadata = { title: "Wishlist — StoreCraft" };

export default async function WishlistPage() {
  await requireAuth(); // wishlist is per-user
  const wishlist = await getWishlist();
  const items = (wishlist?.items ?? []).filter(
    (i) => i.product.isActive && !i.product.isDeleted,
  );

  if (items.length === 0) {
    return (
      <div className="space-y-4 py-12 text-center" data-testid="wishlist-empty">
        <h1 className="text-2xl font-bold">Your wishlist is empty</h1>
        <p className="text-gray-500">Save products to buy them later.</p>
        <Link
          href="/products"
          className="inline-block rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
        >
          Shop products
        </Link>
      </div>
    );
  }

  const views: WishlistItemView[] = items.map((i) => ({
    productId: i.productId,
    name: i.product.name,
    slug: i.product.slug,
    imageUrl: i.product.images[0]?.url ?? null,
    priceFormatted: formatBDT(i.product.price),
    stock: i.product.stock,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Your Wishlist</h1>
      <div>
        {views.map((v) => (
          <WishlistItemRow key={v.productId} item={v} />
        ))}
      </div>
    </div>
  );
}
