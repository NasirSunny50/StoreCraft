import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  getFeaturedProducts,
  getCategories,
  getProducts,
} from "@/lib/queries/product";
import { toCardData } from "@/lib/view/product-card-data";
import { ProductSection } from "@/components/product/product-section";
import { BannerSlider } from "@/components/storefront/banner-slider";

export default async function HomePage() {
  const categories = await getCategories();

  const [featured, ...categoryPages] = await Promise.all([
    getFeaturedProducts(8),
    ...categories.map((c) =>
      getProducts({ sort: "newest", inStock: false, category: c.slug }, 4),
    ),
  ]);

  const categoryBlocks = categories
    .map((c, i) => ({ category: c, items: categoryPages[i]?.items ?? [] }))
    .filter((b) => b.items.length > 0);

  return (
    <div className="space-y-5">
      {/* Hero row: category sidebar + slider + promos */}
      <div className="grid gap-3 lg:grid-cols-[220px_1fr_220px]">
        <aside
          data-testid="category-nav"
          className="hidden overflow-hidden rounded border border-hairline bg-surface lg:block"
        >
          <div className="bg-navbar-2 px-4 py-2.5 text-sm font-semibold text-white">
            Categories
          </div>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="flex items-center justify-between border-b border-hairline px-4 py-2.5 text-sm text-ink last:border-b-0 hover:bg-surface-2 hover:text-accent"
            >
              {c.name}
              <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
          ))}
        </aside>

        <BannerSlider />

        <div className="hidden flex-col gap-3 lg:flex">
          <div className="flex flex-1 flex-col justify-center rounded border border-hairline bg-[linear-gradient(120deg,#e74c3c,#cf3f2f)] p-4 text-white">
            <span className="text-xs font-semibold uppercase">Cash on Delivery</span>
            <p className="mt-1 text-lg font-bold leading-tight">Pay when you receive</p>
          </div>
          <div className="flex flex-1 flex-col justify-center rounded border border-hairline bg-[linear-gradient(120deg,#1f6fb2,#142033)] p-4 text-white">
            <span className="text-xs font-semibold uppercase">Save up to 20%</span>
            <p className="mt-1 text-lg font-bold leading-tight">on selected audio</p>
            <Link href="/category/audio" className="mt-2 text-xs underline">
              Shop now
            </Link>
          </div>
        </div>
      </div>

      {/* Featured */}
      <ProductSection
        title="Featured Products"
        viewAllHref="/products"
        products={featured.map(toCardData)}
        headingTestId="home-heading"
        gridTestId="featured-grid"
      />

      {/* Per-category blocks */}
      {categoryBlocks.map((b) => (
        <ProductSection
          key={b.category.id}
          title={b.category.name}
          viewAllHref={`/category/${b.category.slug}`}
          products={b.items.map(toCardData)}
        />
      ))}
    </div>
  );
}
