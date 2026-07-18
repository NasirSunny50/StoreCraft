import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { getAdminProducts, getDeletedProductCount } from "@/lib/queries/admin-product";
import { formatBDT } from "@/lib/utils/money";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { ProductActiveToggle } from "@/components/admin/product-active-toggle";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { parsePageParams } from "@/lib/pagination";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Products — Admin" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: string; page?: string; perPage?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const { q } = sp;
  const view = sp.view === "deleted" ? "deleted" : "active";
  const { page, perPage, skip, take } = parsePageParams(sp);
  const [{ items: products, total }, deletedCount] = await Promise.all([
    getAdminProducts({ q, view, skip, take }),
    getDeletedProductCount(),
  ]);

  // Tab links preserve the active search (but reset paging).
  const qSuffix = q ? `&q=${encodeURIComponent(q)}` : "";
  const tabs = [
    { key: "active", label: "Active", href: `/admin/products${q ? `?q=${encodeURIComponent(q)}` : ""}` },
    { key: "deleted", label: "Deleted", href: `/admin/products?view=deleted${qSuffix}`, count: deletedCount },
  ] as const;

  return (
    <div>
      <AdminPageHeader title="Products" testId="admin-heading">
        <Link href="/admin/products/import" className={cn(buttonVariants({ variant: "soft", size: "sm" }))}>
          Import CSV
        </Link>
        <Link href="/admin/products/new" className={cn(buttonVariants({ variant: "accent", size: "sm" }))} data-testid="new-product">
          + New Product
        </Link>
      </AdminPageHeader>

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Active / Deleted tabs */}
        <div className="inline-flex rounded-lg border border-hairline-strong bg-surface-2 p-0.5 text-sm" data-testid="product-tabs">
          {tabs.map((t) => {
            const active = view === t.key;
            return (
              <Link
                key={t.key}
                href={t.href}
                data-testid={`product-tab-${t.key}`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors",
                  active ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink",
                )}
              >
                {t.label}
                {"count" in t && t.count > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                      active ? "bg-accent text-white" : "bg-red-100 text-red-700",
                    )}
                  >
                    {t.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Search */}
        <form action="/admin/products" className="flex gap-2 sm:w-auto">
          <input name="q" defaultValue={q ?? ""} placeholder="Search products…" className="w-full rounded border border-hairline-strong px-3 py-1.5 text-sm sm:w-64" />
          {view === "deleted" && <input type="hidden" name="view" value="deleted" />}
          <input type="hidden" name="perPage" value={perPage} />
          <button className="shrink-0 rounded bg-accent px-3 py-1.5 text-sm font-medium text-white">Search</button>
        </form>
      </div>

      <div className="overflow-x-auto rounded border border-hairline">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface-2 text-left text-xs text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Price</th>
              <th className="px-3 py-2 font-medium">Stock</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {products.map((p) => (
              <tr key={p.id} data-testid="admin-product-row" data-slug={p.slug} className="bg-surface">
                <td className="px-3 py-2">
                  <div className="font-medium text-ink">{p.name}</div>
                  <div className="text-xs text-muted">{p.brand?.name ?? "—"}</div>
                </td>
                <td className="px-3 py-2 text-muted">{p.category.name}</td>
                <td className="px-3 py-2 font-medium text-accent">{formatBDT(p.price)}</td>
                <td className="px-3 py-2">{p.stock}</td>
                <td className="px-3 py-2">
                  {p.isDeleted ? (
                    <span className="inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Deleted</span>
                  ) : (
                    <ProductActiveToggle id={p.id} isActive={p.isActive} />
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <ProductRowActions id={p.id} name={p.name} isDeleted={p.isDeleted} />
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-muted">{view === "deleted" ? "No deleted products." : "No products found."}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination total={total} page={page} perPage={perPage} />
    </div>
  );
}
