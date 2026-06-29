import {
  getProducts,
  getProductCount,
  getCategories,
  getBrands,
} from "@/lib/queries/product";
import { toCardData } from "@/lib/view/product-card-data";
import { ProductFilters } from "@/components/product/product-filters";
import { ProductResults } from "@/components/product/product-results";
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" data-testid="listing-heading">
        {heading}
      </h1>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside>
          <ProductFilters
            filter={filter}
            categories={categories}
            brands={brands}
            lockCategory={lockCategory}
            lockBrand={lockBrand}
          />
        </aside>

        <div className="space-y-4">
          <p className="text-sm text-gray-500" data-testid="result-count">
            {count} {count === 1 ? "product" : "products"}
          </p>
          <ProductResults
            key={JSON.stringify(filter)}
            initialItems={initialItems}
            initialCursor={page.nextCursor}
            filter={filter}
          />
        </div>
      </div>
    </div>
  );
}
