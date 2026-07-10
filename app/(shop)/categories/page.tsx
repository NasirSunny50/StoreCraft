import Link from "next/link";
import { getCategories } from "@/lib/queries/product";
import { categoryIcon } from "@/lib/view/category-icon";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-ink md:text-2xl">
        Shop by <span className="text-accent">Category</span>
      </h1>

      {categories.length === 0 ? (
        <p className="text-sm text-muted">No categories yet.</p>
      ) : (
        <div
          data-testid="category-grid"
          className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6"
        >
          <Link
            href="/products"
            className="group flex flex-col items-center gap-2 rounded-lg border border-hairline bg-surface p-4 transition-colors hover:border-accent"
          >
            <span className="grid h-14 w-14 place-items-center rounded-full bg-accent/10 text-accent">
              <span className="text-lg font-bold">All</span>
            </span>
            <span className="text-center text-xs font-medium leading-tight text-ink">
              All Products
            </span>
          </Link>

          {categories.map((c) => {
            const Icon = categoryIcon(c.slug, c.name);
            return (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                data-testid="category-tile"
                className="group flex flex-col items-center gap-2 rounded-lg border border-hairline bg-surface p-4 transition-colors hover:border-accent"
              >
                <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-2 text-ink transition-colors group-hover:bg-accent/10 group-hover:text-accent">
                  <Icon className="h-7 w-7" strokeWidth={1.5} />
                </span>
                <span className="text-center text-xs font-medium leading-tight text-ink">
                  {c.name}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
