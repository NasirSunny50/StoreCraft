import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Check, Truck, ShieldCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries/product";
import { getWishlist } from "@/lib/wishlist";
import { toCardData } from "@/lib/view/product-card-data";
import { formatBDT } from "@/lib/utils/money";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductSection } from "@/components/product/product-section";
import { StarRating } from "@/components/product/star-rating";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { BuyNowButton } from "@/components/cart/buy-now-button";
import { WishlistButton } from "@/components/wishlist/wishlist-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return {
    title: product ? `${product.name} — StoreCraft` : "Product — StoreCraft",
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, session, wishlist] = await Promise.all([
    getRelatedProducts(product.categoryId, product.id),
    auth(),
    getWishlist(),
  ]);
  const isAuthed = !!session?.user;
  const inWishlist =
    wishlist?.items.some((i) => i.productId === product.id) ?? false;
  const sku = product.id.slice(-8).toUpperCase();
  const inStock = product.stock > 0;
  const lowStock = inStock && product.stock <= product.lowStockAt;

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-muted">
        <Link href="/" className="hover:text-accent">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/category/${product.category.slug}`} className="hover:text-accent">
          {product.category.name}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-ink">{product.name}</span>
      </nav>

      {/* Main */}
      <div className="rounded border border-hairline bg-surface p-4 md:p-6">
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          <ProductGallery images={product.images} name={product.name} />

          <div>
            <h1 data-testid="product-title" className="text-xl font-bold leading-snug text-ink md:text-2xl">
              {product.name}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
              {product.ratingCount > 0 ? (
                <StarRating value={product.ratingAvg} count={product.ratingCount} />
              ) : (
                <span>No reviews yet</span>
              )}
              <span>
                Brand:{" "}
                {product.brand ? (
                  <Link href={`/brand/${product.brand.slug}`} className="text-link hover:text-accent">
                    {product.brand.name}
                  </Link>
                ) : (
                  "Generic"
                )}
              </span>
              <span>SKU: {sku}</span>
            </div>

            {/* Price box */}
            <div className="mt-4 rounded border border-hairline bg-surface-2 p-4">
              {product.comparePrice && (
                <div className="text-sm text-muted">
                  Regular Price:{" "}
                  <span className="line-through">{formatBDT(product.comparePrice)}</span>
                </div>
              )}
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-muted">Price:</span>
                <span data-testid="detail-price" className="text-3xl font-bold text-accent">
                  {formatBDT(product.price)}
                </span>
              </div>
              <div className="mt-2">
                <span
                  data-testid="stock-status"
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold ${
                    inStock ? "text-green-600" : "text-accent"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${inStock ? "bg-green-600" : "bg-accent"}`} />
                  {inStock ? (lowStock ? `Only ${product.stock} left` : "In Stock") : "Stock Out"}
                </span>
              </div>
            </div>

            {/* Key features */}
            {product.specs.length > 0 && (
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-bold text-ink">Key Features</h3>
                <ul className="space-y-1 text-sm text-ink/80">
                  {product.specs.slice(0, 5).map((s) => (
                    <li key={s.id} className="flex gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                      <span>
                        <span className="text-muted">{s.key}:</span> {s.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Buy box */}
            <div className="mt-5 max-w-md space-y-3" data-testid="buy-box">
              <AddToCartButton productId={product.id} stock={product.stock} withQuantity size="lg" />
              <div className="grid grid-cols-2 gap-3">
                <BuyNowButton productId={product.id} stock={product.stock} size="lg" />
                <WishlistButton
                  productId={product.id}
                  isAuthed={isAuthed}
                  initiallyInWishlist={inWishlist}
                />
              </div>
            </div>

            {/* Trust strip */}
            <div className="mt-5 flex flex-wrap gap-4 border-t border-hairline pt-4 text-xs text-muted">
              <span className="flex items-center gap-1.5"><Truck className="h-4 w-4" /> Cash on Delivery</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Authentic Product</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4" /> 7-Day Replacement</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description + Specification */}
      <div className="rounded border border-hairline bg-surface">
        <div className="border-b border-hairline px-4 py-3">
          <h2 className="flex items-center gap-2 text-base font-bold">
            <span className="h-4 w-1 rounded-sm bg-accent" />
            Specification
          </h2>
        </div>
        <div className="space-y-4 p-4">
          <p className="text-sm leading-relaxed text-ink/80">{product.description}</p>
          {product.specs.length > 0 && (
            <table data-testid="spec-table" className="w-full border border-hairline text-sm">
              <tbody>
                {product.specs.map((spec, i) => (
                  <tr key={spec.id} className={i % 2 ? "bg-surface-2" : "bg-surface"}>
                    <th className="w-1/3 border border-hairline px-3 py-2 text-left font-medium text-muted">
                      {spec.key}
                    </th>
                    <td className="border border-hairline px-3 py-2">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="rounded border border-hairline bg-surface">
        <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
          <h2 className="flex items-center gap-2 text-base font-bold">
            <span className="h-4 w-1 rounded-sm bg-accent" />
            Reviews
          </h2>
          {product.ratingCount > 0 && (
            <span className="text-xs text-muted">
              {product.ratingAvg.toFixed(1)} / 5 · {product.ratingCount} reviews
            </span>
          )}
        </div>
        <div className="p-4">
          {product.reviews.length === 0 ? (
            <p className="text-sm text-muted" data-testid="no-reviews">
              No reviews yet
            </p>
          ) : (
            <ul className="divide-y divide-hairline" data-testid="review-list">
              {product.reviews.map((review) => (
                <li key={review.id} className="py-3 first:pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{review.user.name}</span>
                    <StarRating value={review.rating} showCount={false} />
                  </div>
                  {review.comment && (
                    <p className="mt-1 text-sm text-ink/80">{review.comment}</p>
                  )}
                  <p className="mt-1 text-xs text-muted">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Related */}
      <ProductSection
        title={`More in ${product.category.name}`}
        viewAllHref={`/category/${product.category.slug}`}
        products={related.map(toCardData)}
        gridTestId="related-grid"
      />
    </div>
  );
}
