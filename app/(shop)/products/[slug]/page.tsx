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
import { ProductBuyBox } from "@/components/product/product-buy-box";
import { ProductTabs } from "@/components/product/product-tabs";

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
            {/* Brand + rating row */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-link">
                {product.brand ? (
                  <Link href={`/brand/${product.brand.slug}`} className="hover:text-accent">
                    {product.brand.name}
                  </Link>
                ) : (
                  "Generic"
                )}
              </span>
              {product.ratingCount > 0 ? (
                <StarRating value={product.ratingAvg} count={product.ratingCount} />
              ) : (
                <span className="text-xs text-muted">No reviews yet</span>
              )}
            </div>

            <h1 data-testid="product-title" className="mt-1 text-xl font-bold leading-snug text-ink md:text-2xl">
              {product.name}
            </h1>

            {/* Inline price row */}
            <div className="mt-3 flex flex-wrap items-baseline gap-2">
              <span data-testid="detail-price" className="text-3xl font-bold text-accent">
                {formatBDT(product.price)}
              </span>
              <span className="text-xs text-muted">(Cash Price)</span>
              {product.comparePrice && (
                <span className="text-sm text-muted line-through">{formatBDT(product.comparePrice)}</span>
              )}
            </div>

            {/* Availability | Code row */}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-hairline pb-4 text-sm">
              <span className="text-muted">
                Availability:{" "}
                <span
                  data-testid="stock-status"
                  className={`inline-flex items-center gap-1.5 font-semibold ${
                    inStock ? "text-green-600" : "text-accent"
                  }`}
                >
                  {inStock ? (lowStock ? `Only ${product.stock} left` : "In Stock") : "Stock Out"}
                </span>
              </span>
              <span className="hidden text-hairline-strong sm:inline">|</span>
              <span className="text-muted">
                Code: <span className="font-medium text-ink">{sku}</span>
              </span>
            </div>

            {/* Buy box (color card + qty + sticky mobile actions) */}
            <div className="mt-4 max-w-md">
              <ProductBuyBox
                productId={product.id}
                stock={product.stock}
                colors={product.colors}
                isAuthed={isAuthed}
                initiallyInWishlist={inWishlist}
              />
            </div>

            {/* Info strips */}
            <div className="mt-5 divide-y divide-hairline rounded-lg border border-hairline text-sm">
              {product.warranty && (
                <div className="flex items-center gap-2.5 px-4 py-3">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
                  <span className="text-ink" data-testid="product-warranty">{product.warranty}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 px-4 py-3">
                <Truck className="h-4 w-4 shrink-0 text-accent" />
                <span className="text-ink">Cash on Delivery available — pay when you receive</span>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-3">
                <Check className="h-4 w-4 shrink-0 text-accent" />
                <span className="text-ink">7-Day Replacement · Authentic Product</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specification / Description / Warranty tabs */}
      <ProductTabs
        specification={
          <div className="space-y-3">
            <h3 className="text-base font-bold text-ink">Specification</h3>
            {product.specs.length > 0 ? (
              <table data-testid="spec-table" className="w-full border border-hairline text-sm">
                <tbody>
                  <tr className="bg-surface">
                    <th className="w-1/3 border border-hairline px-3 py-2 text-left font-medium text-muted">Brand</th>
                    <td className="border border-hairline px-3 py-2">{product.brand?.name ?? "Generic"}</td>
                  </tr>
                  {product.specs.map((spec, i) => (
                    <tr key={spec.id} className={i % 2 ? "bg-surface" : "bg-surface-2"}>
                      <th className="w-1/3 border border-hairline px-3 py-2 text-left font-medium text-muted">
                        {spec.key}
                      </th>
                      <td className="border border-hairline px-3 py-2">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p data-testid="spec-table" className="text-sm text-muted">No specifications listed.</p>
            )}
          </div>
        }
        description={
          <div className="space-y-3">
            <h3 className="text-base font-bold text-ink">Description</h3>
            <p className="text-sm leading-relaxed text-ink/80">{product.description}</p>
          </div>
        }
        warranty={
          <div className="space-y-3">
            <h3 className="text-base font-bold text-ink">Warranty</h3>
            <p className="text-sm leading-relaxed text-ink/80">
              {product.warranty ?? "No brand warranty. 7-day replacement guarantee applies."}
            </p>
          </div>
        }
      />

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
