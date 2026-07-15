import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { getAdminProduct } from "@/lib/queries/admin-product";
import { getCategories, getBrands } from "@/lib/queries/product";
import { getProductCostHistory } from "@/lib/queries/admin-misc";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { formatBDT } from "@/lib/utils/money";

export const metadata = { title: "Edit Product — Admin" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [product, categories, brands, costHistory] = await Promise.all([
    getAdminProduct(id),
    getCategories(),
    getBrands(),
    getProductCostHistory(id),
  ]);
  if (!product) notFound();

  const reasonLabel: Record<string, string> = {
    RESTOCK: "Restock",
    COST_EDIT: "Manual edit",
    INITIAL: "Initial",
  };

  return (
    <div>
      <AdminPageHeader title="Edit Product" testId="admin-heading" />
      <ProductForm
        mode="edit"
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price.toString(),
          comparePrice: product.comparePrice?.toString() ?? "",
          costPrice: product.costPrice?.toString() ?? "",
          stock: product.stock,
          lowStockAt: product.lowStockAt,
          categoryId: product.categoryId,
          brandId: product.brandId ?? "",
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          warranty: product.warranty ?? "",
          colors: product.colors,
          specs: product.specs.map((s) => ({ key: s.key, value: s.value })),
          images: product.images.map((i) => i.url),
        }}
      />

      {/* Cost history — every restock (with buying price) and manual cost edit. */}
      <section id="cost-history" className="mt-8 scroll-mt-24" data-testid="cost-history">
        <h2 className="mb-1 text-base font-bold text-ink">Cost History</h2>
        <p className="mb-3 text-xs text-muted">
          Current average cost: <span className="font-semibold text-ink">{formatBDT(product.costPrice)}</span>.
          Restocks update this as a weighted average; sales lock the cost of the day.
        </p>
        <div className="overflow-x-auto rounded border border-hairline">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-surface-2 text-left text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Event</th>
                <th className="px-3 py-2 font-medium">Qty added</th>
                <th className="px-3 py-2 font-medium">Buying (unit) cost</th>
                <th className="px-3 py-2 font-medium">Avg cost after</th>
                <th className="px-3 py-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {costHistory.map((h) => (
                <tr key={h.id} className="bg-surface">
                  <td className="px-3 py-2 font-medium text-ink">{reasonLabel[h.reason] ?? h.reason}</td>
                  <td className="px-3 py-2 text-muted">{h.change > 0 ? `+${h.change}` : "—"}</td>
                  <td className="px-3 py-2 text-muted">{h.unitCost ? formatBDT(h.unitCost) : "—"}</td>
                  <td className="px-3 py-2 font-semibold text-accent">{h.costAfter ? formatBDT(h.costAfter) : "—"}</td>
                  <td className="px-3 py-2 text-muted">{new Date(h.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {costHistory.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-muted">No cost changes recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
