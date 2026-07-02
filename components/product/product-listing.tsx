import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  getProducts,
  getProductCount,
  getCategories,
  getBrands,
} from "@/lib/queries/product";
import { toCardData } from "@/lib/view/product-card-data";
import { ProductFilters } from "@/components/product/product-filters";
import { ProductResults } from "@/components/product/product-results";
import { ListingShell } from "@/components/product/listing-shell";
import type { ProductFilter } from "@/lib/validators/product";

export async function ProductListing({
  filter,
  heading,
  lockCategory = false,
  lockBrand = false,
}: {
  filter: ProductFilter;
  heading: string;
  lockCategory?: boolean;
  lockBrand?: boolean;
}) {
  const [page, count, categories, brands] = await Promise.all([
    getProducts(filter),
    getProductCount(filter),
    getCategories(),
    getBrands(),
  ]);
  const initialItems = page.items.map(toCardData);

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-2 flex items-center gap-1 text-xs text-muted">
        <Link href="/" className="hover:text-accent">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-ink">{heading}</span>
      </nav>

      <h1 className="text-2xl font-bold text-ink md:text-3xl" data-testid="listing-heading">
        {heading}
      </h1>
      <p className="mb-4 mt-1 text-sm text-muted">
        Showing:{" "}
        <span className="font-semibold text-ink" data-testid="result-count">
          {count} {count === 1 ? "product" : "products"}
        </span>
      </p>

      <ListingShell
        sort={filter.sort}
        filters={
          <ProductFilters
            filter={filter}
            categories={categories}
            brands={brands}
            lockCategory={lockCategory}
            lockBrand={lockBrand}
          />
        }
      >
        <ProductResults
          key={JSON.stringify(filter)}
          initialItems={initialItems}
          initialCursor={page.nextCursor}
          filter={filter}
        />
      </ListingShell>
    </div>
  );
}
