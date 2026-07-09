import { requireAdmin } from "@/lib/auth-guard";
import { getSalesReport } from "@/lib/queries/admin-dashboard";
import { getInventory } from "@/lib/queries/admin-misc";
import { formatBDT } from "@/lib/utils/money";
import { AdminPageHeader } from "@/components/admin/page-header";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { parsePageParams } from "@/lib/pagination";

export const metadata = { title: "Reports — Admin" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; page?: string; perPage?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const { from, to } = sp;
  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(`${to}T23:59:59`) : undefined;
  const { page, perPage, skip, take } = parsePageParams(sp);

  const [report, lowStock] = await Promise.all([
    getSalesReport(fromDate, toDate),
    getInventory(true),
  ]);
  const pagedOrders = report.orders.slice(skip, skip + take);

  const exportQs = new URLSearchParams();
  if (from) exportQs.set("from", from);
  if (to) exportQs.set("to", to);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Reports" testId="admin-heading" />

      <section className="rounded border border-hairline bg-surface p-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <form action="/admin/reports" className="flex flex-wrap items-end gap-2 text-sm">
            <label className="flex flex-col">
              <span className="text-xs text-muted">From</span>
              <input type="date" name="from" defaultValue={from ?? ""} className="rounded border border-hairline-strong px-2 py-1.5" />
            </label>
            <label className="flex flex-col">
              <span className="text-xs text-muted">To</span>
              <input type="date" name="to" defaultValue={to ?? ""} className="rounded border border-hairline-strong px-2 py-1.5" />
            </label>
            <input type="hidden" name="perPage" value={perPage} />
            <button className="rounded bg-accent px-3 py-1.5 font-medium text-white">Apply</button>
          </form>
          <a
            href={`/api/admin/reports/sales.csv?${exportQs.toString()}`}
            data-testid="export-csv"
            className="rounded border border-hairline-strong px-3 py-1.5 text-sm font-medium hover:bg-surface-2"
          >
            ⬇ Export CSV
          </a>
        </div>

        <div className="flex gap-8 border-y border-hairline py-3 text-sm">
          <div>
            <div className="text-xs text-muted">Total sales</div>
            <div data-testid="report-total" className="text-xl font-bold text-accent">{formatBDT(report.total)}</div>
          </div>
          <div>
            <div className="text-xs text-muted">Orders</div>
            <div data-testid="report-count" className="text-xl font-bold">{report.count}</div>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-surface-2 text-left text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Order</th>
                <th className="px-3 py-2 font-medium">Customer</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Total</th>
                <th className="px-3 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {pagedOrders.map((o) => (
                <tr key={o.id} className="bg-surface">
                  <td className="px-3 py-2 font-medium">{o.orderNumber}</td>
                  <td className="px-3 py-2 text-muted">{o.user.name}</td>
                  <td className="px-3 py-2"><OrderStatusBadge status={o.status} /></td>
                  <td className="px-3 py-2 font-medium text-accent">{formatBDT(o.total)}</td>
                  <td className="px-3 py-2 text-muted">{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {report.orders.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-muted">No sales in range.</td></tr>}
            </tbody>
          </table>
        </div>

        <AdminPagination total={report.count} page={page} perPage={perPage} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-ink">Low-stock products ({lowStock.length})</h2>
        <div className="overflow-x-auto rounded border border-hairline">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-surface-2 text-left text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Product</th>
                <th className="px-3 py-2 font-medium">Stock</th>
                <th className="px-3 py-2 font-medium">Threshold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {lowStock.map((p) => (
                <tr key={p.id} className="bg-surface">
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2 font-semibold text-accent">{p.stock}</td>
                  <td className="px-3 py-2 text-muted">{p.lowStockAt}</td>
                </tr>
              ))}
              {lowStock.length === 0 && <tr><td colSpan={3} className="px-3 py-6 text-center text-muted">All stocked up.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
