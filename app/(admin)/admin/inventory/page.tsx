import Link from "next/link";
import { requireStaff } from "@/lib/auth-guard";
import { getInventory, getRecentStockLogs } from "@/lib/queries/admin-misc";
import { AdminPageHeader } from "@/components/admin/page-header";
import { StockAdjust } from "@/components/admin/stock-adjust";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Inventory — Admin" };

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ low?: string }>;
}) {
  await requireStaff();
  const { low } = await searchParams;
  const lowOnly = low === "1";
  const [items, logs] = await Promise.all([
    getInventory(lowOnly),
    getRecentStockLogs(20),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Inventory" testId="admin-heading">
        <Link href={lowOnly ? "/admin/inventory" : "/admin/inventory?low=1"} className="text-xs text-link hover:underline">
          {lowOnly ? "Show all" : "Show low-stock only"}
        </Link>
      </AdminPageHeader>

      <div className="overflow-hidden rounded border border-hairline">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Product</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Stock</th>
              <th className="px-3 py-2 font-medium">Threshold</th>
              <th className="px-3 py-2 font-medium">Adjust</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {items.map((p) => {
              const lowStock = p.stock <= p.lowStockAt;
              return (
                <tr key={p.id} data-testid="inventory-row" data-slug={p.slug} className="bg-surface">
                  <td className="px-3 py-2 font-medium text-ink">{p.name}</td>
                  <td className="px-3 py-2 text-muted">{p.category.name}</td>
                  <td className="px-3 py-2">
                    <span data-testid="inv-stock" className={cn("font-semibold", lowStock ? "text-accent" : "text-ink")}>
                      {p.stock}
                    </span>
                    {lowStock && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">LOW</span>}
                  </td>
                  <td className="px-3 py-2 text-muted">{p.lowStockAt}</td>
                  <td className="px-3 py-2"><StockAdjust productId={p.id} /></td>
                </tr>
              );
            })}
            {items.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-muted">No products.</td></tr>}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-bold text-ink">Recent stock changes</h2>
        <div className="overflow-hidden rounded border border-hairline">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Product</th>
                <th className="px-3 py-2 font-medium">Change</th>
                <th className="px-3 py-2 font-medium">Reason</th>
                <th className="px-3 py-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {logs.map((l) => (
                <tr key={l.id} className="bg-surface">
                  <td className="px-3 py-2">{l.product.name}</td>
                  <td className={cn("px-3 py-2 font-semibold", l.change < 0 ? "text-accent" : "text-green-700")}>
                    {l.change > 0 ? `+${l.change}` : l.change}
                  </td>
                  <td className="px-3 py-2 text-muted">{l.reason}</td>
                  <td className="px-3 py-2 text-muted">{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-muted">No changes yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
