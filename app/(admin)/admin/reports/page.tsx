import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { requireAdmin } from "@/lib/auth-guard";
import { DatePicker } from "@/components/admin/date-picker";
import { FilterSelect } from "@/components/admin/filter-select";
import { getSalesReport } from "@/lib/queries/admin-dashboard";
import {
  getSalesSummary,
  getProductSalesReport,
  getCategorySalesReport,
  type ProductSort,
  type CategorySort,
} from "@/lib/queries/admin-reports";
import { getCategories } from "@/lib/queries/product";
import { getInventory } from "@/lib/queries/admin-misc";
import type { OrderStatus } from "@prisma/client";
import { formatBDT } from "@/lib/utils/money";
import { AdminPageHeader } from "@/components/admin/page-header";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { parsePageParams } from "@/lib/pagination";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Reports — Admin" };

const TABS = [
  { key: "summary", label: "Sales Summary" },
  { key: "products", label: "Product-wise" },
  { key: "categories", label: "Category-wise" },
  { key: "orders", label: "Orders" },
] as const;

type ReportKey = (typeof TABS)[number]["key"];

const PRODUCT_SORTS = [
  { value: "revenue", label: "Revenue" },
  { value: "profit", label: "Profit" },
  { value: "margin", label: "Margin" },
  { value: "qty", label: "Qty Sold" },
] as const;

const CATEGORY_SORTS = [
  { value: "revenue", label: "Revenue" },
  { value: "profit", label: "Profit" },
  { value: "margin", label: "Margin" },
] as const;

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"] as const;

const pct = (r: number) => `${(r * 100).toFixed(1)}%`;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    page?: string;
    perPage?: string;
    report?: string;
    cat?: string;
    sort?: string;
    status?: string;
  }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const { from, to } = sp;
  const report = (TABS.some((t) => t.key === sp.report) ? sp.report : "summary") as ReportKey;
  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(`${to}T23:59:59`) : undefined;

  // Report-specific filters (validated against the active report so a stale
  // param from another tab is ignored).
  const cat = report === "products" ? sp.cat : undefined;
  const productSort =
    report === "products" && PRODUCT_SORTS.some((s) => s.value === sp.sort)
      ? (sp.sort as ProductSort)
      : undefined;
  const categorySort =
    report === "categories" && CATEGORY_SORTS.some((s) => s.value === sp.sort)
      ? (sp.sort as CategorySort)
      : undefined;
  const status =
    report === "orders" && ORDER_STATUSES.some((s) => s === sp.status)
      ? (sp.status as OrderStatus)
      : undefined;

  const categories = report === "products" ? await getCategories() : [];

  // from/to persist across tabs; report-specific params only ride along when set.
  const qs = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    Object.entries(extra).forEach(([k, v]) => v && p.set(k, v));
    return p.toString();
  };

  // Params to carry into export links for the active report.
  const exportParams: Record<string, string | undefined> = {
    report,
    cat,
    sort: productSort ?? categorySort,
    status,
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader title="Reports" testId="admin-heading" />

      {/* Date filter (shared across tabs) */}
      <form action="/admin/reports" className="flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:items-end">
        <input type="hidden" name="report" value={report} />
        <div className="flex gap-2">
          <DatePicker name="from" label="From" defaultValue={from ?? ""} />
          <DatePicker name="to" label="To" defaultValue={to ?? ""} />
        </div>

        {/* Product-wise: category + sort */}
        {report === "products" && (
          <>
            <FilterSelect name="cat" label="Category" defaultValue={cat ?? ""} testId="filter-cat">
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </FilterSelect>
            <FilterSelect name="sort" label="Sort by" defaultValue={productSort ?? "revenue"} testId="filter-sort">
              {PRODUCT_SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </FilterSelect>
          </>
        )}

        {/* Category-wise: sort */}
        {report === "categories" && (
          <FilterSelect name="sort" label="Sort by" defaultValue={categorySort ?? "revenue"} testId="filter-sort">
            {CATEGORY_SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </FilterSelect>
        )}

        {/* Orders: status */}
        {report === "orders" && (
          <FilterSelect name="status" label="Status" defaultValue={status ?? ""} testId="filter-status">
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </FilterSelect>
        )}

        <button className="rounded-lg bg-accent px-4 py-2 font-medium text-white hover:bg-accent-strong">Apply</button>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <a
            href={`/api/admin/reports/sales.csv?${qs(exportParams)}`}
            data-testid="export-csv"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-hairline-strong px-3 py-2 font-medium text-ink hover:border-accent hover:text-accent sm:flex-none"
          >
            <Download className="h-4 w-4" /> Export CSV
          </a>
          <a
            href={`/reports-pdf?${qs(exportParams)}`}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="export-pdf"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-hairline-strong px-3 py-2 font-medium text-ink hover:border-accent hover:text-accent sm:flex-none"
          >
            <FileText className="h-4 w-4" /> Export PDF
          </a>
        </div>
      </form>

      {/* Report tabs */}
      <div className="flex flex-wrap gap-1 border-b border-hairline">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/reports?${qs({ report: t.key })}`}
            data-testid={`report-tab-${t.key}`}
            className={cn(
              "rounded-t px-3 py-2 text-sm font-medium",
              report === t.key ? "border-b-2 border-accent text-accent" : "text-muted hover:text-ink",
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {report === "summary" && <SummaryReport from={fromDate} to={toDate} />}
      {report === "products" && <ProductReport from={fromDate} to={toDate} categorySlug={cat} sort={productSort} />}
      {report === "categories" && <CategoryReport from={fromDate} to={toDate} sort={categorySort} />}
      {report === "orders" && <OrdersReport from={fromDate} to={toDate} status={status} sp={sp} />}
    </div>
  );
}

const maxBy = <T,>(arr: T[], f: (x: T) => number): T | undefined =>
  arr.reduce<T | undefined>((best, x) => (best === undefined || f(x) > f(best) ? x : best), undefined);

// ---------- 1. Sales Summary ----------
async function SummaryReport({ from, to }: { from?: Date; to?: Date }) {
  const [s, products, categories] = await Promise.all([
    getSalesSummary(from, to),
    getProductSalesReport(from, to),
    getCategorySalesReport(from, to),
  ]);

  const topProfitProduct = maxBy(products, (p) => p.profit.toNumber());
  const topMarginProduct = maxBy(products.filter((p) => p.soldQty > 0), (p) => p.margin);
  const topRevenueCategory = categories[0]; // already revenue-sorted
  const topMarginCategory = maxBy(categories, (c) => c.margin);

  return (
    <div className="space-y-4" data-testid="report-summary">
      {/* Headline: sales + profit up front */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total Sales" value={formatBDT(s.totalSales)} tone="accent" />
        <Kpi label="Gross Profit" value={formatBDT(s.grossProfit)} tone="profit" testId="kpi-profit" />
        <Kpi label="Profit Margin" value={pct(s.profitMargin)} tone="profit" testId="kpi-margin" />
        <Kpi label="Total Orders" value={String(s.totalOrders)} />
      </div>

      {/* Revenue → profit breakdown */}
      <div className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
        <Stat label="Gross Revenue" value={formatBDT(s.grossRevenue)} />
        <Stat label="Cost of Goods (COGS)" value={formatBDT(s.totalCost)} />
        <Stat label="Net Revenue" value={formatBDT(s.netRevenue)} />
        <Stat label="Avg Order Value" value={formatBDT(s.avgOrderValue)} />
        <Stat label="Items sold" value={String(s.itemsSold)} />
        <Stat label="Total discount" value={formatBDT(s.totalDiscount)} />
        <Stat label="Shipping collected" value={formatBDT(s.totalShipping)} />
        <Stat label="Paid orders" value={`${s.paidOrders} · ${formatBDT(s.paidSales)}`} />
        <Stat label="Cash on Delivery" value={String(s.codOrders)} />
        <Stat label="Online payment" value={String(s.onlineOrders)} />
        <Stat label="Cancelled orders" value={String(s.cancelledOrders)} />
        <Stat label="Cancellation rate" value={pct(s.cancellationRate)} />
      </div>

      {/* Business insights */}
      <div className="rounded-lg border border-hairline bg-surface p-4">
        <h3 className="mb-3 text-sm font-bold text-ink">Business Insights</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Insight label="Most profitable product" value={topProfitProduct?.name ?? "—"} sub={topProfitProduct ? formatBDT(topProfitProduct.profit) : ""} />
          <Insight label="Best-margin product" value={topMarginProduct?.name ?? "—"} sub={topMarginProduct ? `${pct(topMarginProduct.margin)} margin` : ""} />
          <Insight label="Top category (revenue)" value={topRevenueCategory?.category ?? "—"} sub={topRevenueCategory ? formatBDT(topRevenueCategory.revenue) : ""} />
          <Insight label="Best-margin category" value={topMarginCategory?.category ?? "—"} sub={topMarginCategory ? `${pct(topMarginCategory.margin)} margin` : ""} />
        </div>
      </div>

      <p className="text-xs text-muted">
        <strong>Profit calculation:</strong> Gross Profit = Gross Revenue − Cost of Goods (buying price ×
        qty). Profit Margin = Gross Profit ÷ Gross Revenue. Excludes cancelled orders; profit is before
        order-level coupon discounts.
      </p>
    </div>
  );
}

// ---------- 2. Product-wise ----------
async function ProductReport({
  from,
  to,
  categorySlug,
  sort,
}: {
  from?: Date;
  to?: Date;
  categorySlug?: string;
  sort?: ProductSort;
}) {
  const rows = await getProductSalesReport(from, to, { categorySlug, sort });
  return (
    <ReportTable
      testId="report-products"
      head={["Product", "Category", "Qty Sold", "Revenue", "Profit", "Margin", "Cancellation"]}
      empty="No product sales in range."
      rows={rows.map((r) => (
        <tr key={r.productId} className="bg-surface">
          <td className="px-3 py-2 font-medium">{r.name}</td>
          <td className="px-3 py-2 text-muted">{r.category}</td>
          <td className="px-3 py-2">{r.soldQty}</td>
          <td className="px-3 py-2 font-medium text-accent">{formatBDT(r.revenue)}</td>
          <td className={cn("px-3 py-2 font-medium", r.profit.isNegative() ? "text-red-600" : "text-green-600")}>{formatBDT(r.profit)}</td>
          <td className={cn("px-3 py-2 font-medium", r.margin < 0 ? "text-red-600" : "text-green-600")}>{pct(r.margin)}</td>
          <td className="px-3 py-2 text-muted">{pct(r.cancellationRate)}</td>
        </tr>
      ))}
    />
  );
}

// ---------- 3. Category-wise ----------
async function CategoryReport({ from, to, sort }: { from?: Date; to?: Date; sort?: CategorySort }) {
  const rows = await getCategorySalesReport(from, to, { sort });
  return (
    <ReportTable
      testId="report-categories"
      head={["Category", "Orders", "Items Sold", "Revenue", "Profit", "Margin"]}
      empty="No category sales in range."
      rows={rows.map((r) => (
        <tr key={r.category} className="bg-surface">
          <td className="px-3 py-2 font-medium">{r.category}</td>
          <td className="px-3 py-2">{r.orders}</td>
          <td className="px-3 py-2">{r.itemsSold}</td>
          <td className="px-3 py-2 font-medium text-accent">{formatBDT(r.revenue)}</td>
          <td className={cn("px-3 py-2 font-medium", r.profit.isNegative() ? "text-red-600" : "text-green-600")}>{formatBDT(r.profit)}</td>
          <td className={cn("px-3 py-2 font-medium", r.margin < 0 ? "text-red-600" : "text-green-600")}>{pct(r.margin)}</td>
        </tr>
      ))}
    />
  );
}

// ---------- 4. Orders (existing list + low stock) ----------
async function OrdersReport({
  from,
  to,
  status,
  sp,
}: {
  from?: Date;
  to?: Date;
  status?: OrderStatus;
  sp: { page?: string; perPage?: string };
}) {
  const { page, perPage, skip, take } = parsePageParams(sp);
  const [report, lowStock] = await Promise.all([getSalesReport(from, to, status), getInventory(true)]);
  const pagedOrders = report.orders.slice(skip, skip + take);

  return (
    <div className="space-y-6">
      <section className="rounded border border-hairline bg-surface p-4">
        <div className="flex gap-8 border-b border-hairline pb-3 text-sm">
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
                  <td className="px-3 py-2 text-muted">{o.user?.name ?? `${o.address.fullName} (Guest)`}</td>
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

// ---------- shared UI ----------
function Kpi({ label, value, tone, testId }: { label: string; value: string; tone?: "accent" | "profit"; testId?: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface p-3">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div
        data-testid={testId}
        className={cn("mt-1 text-lg font-bold", tone === "accent" ? "text-accent" : tone === "profit" ? "text-green-600" : "text-ink")}
      >
        {value}
      </div>
    </div>
  );
}

function Insight({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-2 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-0.5 truncate font-semibold text-ink">{value}</div>
      {sub && <div className="text-xs text-accent">{sub}</div>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded border border-hairline bg-surface px-3 py-2">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

function ReportTable({
  head,
  rows,
  empty,
  testId,
}: {
  head: string[];
  rows: React.ReactNode[];
  empty: string;
  testId: string;
}) {
  return (
    <div className="overflow-x-auto rounded border border-hairline" data-testid={testId}>
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-surface-2 text-left text-xs text-muted">
          <tr>{head.map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {rows.length > 0 ? rows : <tr><td colSpan={head.length} className="px-3 py-6 text-center text-muted">{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
