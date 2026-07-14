import Link from "next/link";
import { Tag } from "lucide-react";
import { getOnSaleProducts, type ProductListItem } from "@/lib/queries/product";
import { toCardData } from "@/lib/view/product-card-data";
import { ProductSection } from "@/components/product/product-section";

export const metadata = { title: "Offers" };

type Group = { name: string; slug: string; items: ProductListItem[] };

export default async function OffersPage() {
  const products = await getOnSaleProducts();

  // Group the on-sale products by their category (preserving query order).
  const byCategory = new Map<string, Group>();
  for (const p of products) {
    const key = p.category.slug;
    if (!byCategory.has(key)) {
      byCategory.set(key, { name: p.category.name, slug: p.category.slug, items: [] });
    }
    byCategory.get(key)!.items.push(p);
  }
  const groups = [...byCategory.values()];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink md:text-2xl">
          <Tag className="h-6 w-6 text-accent" /> Offers
        </h1>
        <p className="mt-1 text-sm text-muted">
          Products on sale right now — grab them before the discount ends.
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-lg border border-hairline bg-surface py-16 text-center" data-testid="offers-empty">
          <Tag className="mx-auto h-10 w-10 text-hairline-strong" strokeWidth={1.25} />
          <p className="mt-3 font-semibold text-ink">No active offers</p>
          <p className="mt-1 text-sm text-muted">Check back soon for discounts.</p>
          <Link href="/products" className="mt-4 inline-block text-sm font-medium text-link hover:text-accent">
            Browse all products →
          </Link>
        </div>
      ) : (
        <div className="space-y-4" data-testid="offers-groups">
          {groups.map((g) => (
            <ProductSection
              key={g.slug}
              title={g.name}
              products={g.items.map(toCardData)}
              gridTestId="offers-grid"
            />
          ))}
        </div>
      )}
    </div>
  );
}
