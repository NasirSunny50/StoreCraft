import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { getAdminProducts } from "@/lib/queries/admin-product";
import { formatBDT } from "@/lib/utils/money";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ProductRowActions } from "@/components/admin/product-row-actions";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { parsePageParams } from "@/lib/pagination";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Products — Admin" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; deleted?: string; page?: string; perPage?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const { q, deleted } = sp;
  const includeDeleted = deleted === "1";
  const { page, perPage, skip, take } = parsePageParams(sp);
  const { items: products, total } = await getAdminProducts({ q, includeDeleted, skip, take });

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

      <div className="mb-3 flex items-center gap-3">
        <form action="/admin/products" className="flex gap-2">
          <input name="q" defaultValue={q ?? ""} placeholder="Search products…" className="w-64 rounded border border-hairline-strong px-3 py-1.5 text-sm" />
          {includeDeleted && <input type="hidden" name="deleted" value="1" />}
          <input type="hidden" name="perPage" value={perPage} />
          <button className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white">Search</button>
        </form>
        <Link
          href={includeDeleted ? "/admin/products" : "/admin/products?deleted=1"}
          className="text-xs text-link hover:underline"
        >
          {includeDeleted ? "Hide deleted" : "Show deleted"}
        </Link>
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
                  <span className={cn("rounded px-2 py-0.5 text-xs font-semibold", p.isDeleted ? "bg-red-100 text-red-700" : p.isActive ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800")}>
                    {p.isDeleted ? "Deleted" : p.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <ProductRowActions id={p.id} isDeleted={p.isDeleted} />
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-muted">No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination total={total} page={page} perPage={perPage} />
    </div>
  );
}
