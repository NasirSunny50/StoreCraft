import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import type { ProductCardData } from "@/lib/view/product-card-data";

export function ProductSection({
  title,
  viewAllHref,
  products,
  headingTestId,
  gridTestId,
}: {
  title: string;
  viewAllHref: string;
  products: ProductCardData[];
  headingTestId?: string;
  gridTestId?: string;
}) {
  if (products.length === 0) return null;

  return (
    <section className="rounded border border-hairline bg-surface">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
        <h2
          data-testid={headingTestId}
          className="flex items-center gap-2 text-base font-bold text-ink"
        >
          <span className="h-4 w-1 rounded-sm bg-accent" />
          {title}
        </h2>
        <Link
          href={viewAllHref}
          className="text-xs font-medium text-link hover:text-accent"
        >
          View All →
        </Link>
      </div>
      <div
        data-testid={gridTestId}
        className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4"
      >
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
