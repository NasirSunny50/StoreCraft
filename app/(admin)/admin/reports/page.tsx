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
  getBrandSalesReport,
  getProfitLoss,
  getCustomerPurchaseReport,
  type ProductSort,
  type CategorySort,
  type BrandSort,
  type CustomerSort,
} from "@/lib/queries/admin-reports";
import { getCategories, getProductOptions } from "@/lib/queries/product";
import { getInventory } from "@/lib/queries/admin-misc";
import type { OrderStatus } from "@prisma/client";
import { formatBDT } from "@/lib/utils/money";
import { formatDate } from "@/lib/utils/date";
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
  { key: "brands", label: "Brand-wise" },
  { key: "pnl", label: "Profit & Loss" },
  { key: "customers", label: "Customers" },
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

const BRAND_SORTS = [
  { value: "revenue", label: "Revenue" },
  { value: "profit", label: "Profit" },
  { value: "units", label: "Units Sold" },
  { value: "margin", label: "Margin" },
] as const;

const CUSTOMER_SORTS = [
  { value: "spend", label: "Total Spend" },
  { value: "orders", label: "Total Orders" },
  { value: "aov", label: "Avg Order Value" },
  { value: "recent", label: "Recent Purchase" },
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
    product?: string;
    sort?: string;
    order?: string;
    customer?: string;
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
  const cat = report === "products" || report === "categories" ? sp.cat || undefined : undefined;
  const productSort =
    report === "products" && PRODUCT_SORTS.some((s) => s.value === sp.sort)
      ? (sp.sort as ProductSort)
      : undefined;
  const categorySort =
    report === "categories" && CATEGORY_SORTS.some((s) => s.value === sp.sort)
      ? (sp.sort as CategorySort)
      : undefined;
  const brandSort =
    report === "brands" && BRAND_SORTS.some((s) => s.value === sp.sort)
      ? (sp.sort as BrandSort)
      : undefined;
  const customerSort =
    report === "customers" && CUSTOMER_SORTS.some((s) => s.value === sp.sort)
      ? (sp.sort as CustomerSort)
      : undefined;
  const orderNo = report === "orders" ? sp.order?.trim() || undefined : undefined;
  const customer = report === "orders" ? sp.customer?.trim() || undefined : undefined;
  const status =
    report === "orders" && ORDER_STATUSES.some((s) => s === sp.status)
      ? (sp.status as OrderStatus)
      : undefined;

  // Category dropdown feeds both product-wise and category-wise tabs; the
  // product dropdown is scoped to the chosen category on the product tab.
  const categories = report === "products" || report === "categories" ? await getCategories() : [];
  const productOptions = report === "products" ? await getProductOptions(cat) : [];
  // Only honour a product filter that belongs to the (possibly category-scoped) list.
  const product =
    report === "products" && sp.product && productOptions.some((p) => p.id === sp.product)
      ? sp.product
      : undefined;

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
    product,
    sort: productSort ?? categorySort ?? brandSort ?? customerSort,
    order: orderNo,
    customer,
    status,
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader title="Reports" testId="admin-heading" />

      {/* Date filter (shared across tabs). Keyed on the active params so a soft
          navigation (Clear, tab switch) remounts the uncontrolled inputs and
          they pick up the new defaults instead of keeping stale values. */}
      <form
        key={`${report}|${from ?? ""}|${to ?? ""}|${cat ?? ""}|${productSort ?? categorySort ?? brandSort ?? customerSort ?? ""}|${product ?? ""}|${orderNo ?? ""}|${customer ?? ""}|${status ?? ""}`}
        action="/admin/reports"
        className="flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:items-end"
      >
        <input type="hidden" name="report" value={report} />
        <div className="flex gap-2">
          <DatePicker name="from" label="From" defaultValue={from ?? ""} />
          <DatePicker name="to" label="To" defaultValue={to ?? ""} />
        </div>

        {/* Product-wise: product + category + sort */}
        {report === "products" && (
          <>
            <FilterSelect name="cat" label="Category" defaultValue={cat ?? ""} testId="filter-cat">
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </FilterSelect>
            <FilterSelect name="product" label="Product" defaultValue={product ?? ""} testId="filter-product">
              <option value="">All products</option>
              {productOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </FilterSelect>
            <FilterSelect name="sort" label="Sort by" defaultValue={productSort ?? "revenue"} testId="filter-sort">
              {PRODUCT_SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </FilterSelect>
          </>
        )}

        {/* Category-wise: category + sort */}
        {report === "categories" && (
          <>
            <FilterSelect name="cat" label="Category" defaultValue={cat ?? ""} testId="filter-cat">
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </FilterSelect>
            <FilterSelect name="sort" label="Sort by" defaultValue={categorySort ?? "revenue"} testId="filter-sort">
              {CATEGORY_SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </FilterSelect>
          </>
        )}

        {/* Brand-wise: sort */}
        {report === "brands" && (
          <FilterSelect name="sort" label="Sort by" defaultValue={brandSort ?? "revenue"} testId="filter-sort">
            {BRAND_SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </FilterSelect>
        )}

        {/* Customers: sort */}
        {report === "customers" && (
          <FilterSelect name="sort" label="Sort by" defaultValue={customerSort ?? "spend"} testId="filter-sort">
            {CUSTOMER_SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </FilterSelect>
        )}

        {/* Orders: order # + customer + status */}
        {report === "orders" && (
          <>
            <FilterText name="order" label="Order #" defaultValue={orderNo ?? ""} placeholder="Order number" testId="filter-order" />
            <FilterText name="customer" label="Customer" defaultValue={customer ?? ""} placeholder="Name or email" testId="filter-customer" />
            <FilterSelect name="status" label="Status" defaultValue={status ?? ""} testId="filter-status">
              <option value="">All statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
              ))}
            </FilterSelect>
          </>
        )}

        <div className="flex gap-2">
          <button className="rounded-lg bg-accent px-4 py-2 font-medium text-white hover:bg-accent-strong">Apply</button>
          {/* Reset all filters (dates + report-specific) but stay on the active tab. */}
          <Link
            href={`/admin/reports?report=${report}`}
            data-testid="filter-clear"
            className="rounded-lg border border-hairline-strong px-4 py-2 font-medium text-ink hover:border-accent hover:text-accent"
          >
            Clear
          </Link>
        </div>
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
      {report === "products" && <ProductReport from={fromDate} to={toDate} categorySlug={cat} productId={product} sort={productSort} sp={sp} />}
      {report === "categories" && <CategoryReport from={fromDate} to={toDate} categorySlug={cat} sort={categorySort} sp={sp} />}
      {report === "brands" && <BrandReport from={fromDate} to={toDate} sort={brandSort} sp={sp} />}
      {report === "pnl" && <ProfitLossReport from={fromDate} to={toDate} />}
      {report === "customers" && <CustomerReport from={fromDate} to={toDate} sort={customerSort} sp={sp} />}
      {report === "orders" && <OrdersReport from={fromDate} to={toDate} status={status} orderNumber={orderNo} customer={customer} sp={sp} />}
    </div>
  );
}

const maxBy = <T,>(arr: T[], f: (x: T) => number): T | undefined =>
  arr.reduce<T | undefined>((best, x) => (best === undefined || f(x) > f(best) ? x : best), undefined);

type PageSp = { page?: string; perPage?: string };

/** Slice a fully-computed report list for the current page. */
function withPage<T>(all: T[], sp: PageSp) {
  const { page, perPage, skip, take } = parsePageParams(sp);
  return { rows: all.slice(skip, skip + take), page, perPage, total: all.length };
}

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
  productId,
  sort,
  sp,
}: {
  from?: Date;
  to?: Date;
  categorySlug?: string;
  productId?: string;
  sort?: ProductSort;
  sp: PageSp;
}) {
  const all = await getProductSalesReport(from, to, { categorySlug, productId, sort });
  const { rows, page, perPage, total } = withPage(all, sp);
  return (
    <div className="space-y-3">
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
      <AdminPagination total={total} page={page} perPage={perPage} />
    </div>
  );
}

// ---------- 3. Category-wise ----------
async function CategoryReport({ from, to, categorySlug, sort, sp }: { from?: Date; to?: Date; categorySlug?: string; sort?: CategorySort; sp: PageSp }) {
  const all = await getCategorySalesReport(from, to, { categorySlug, sort });
  const { rows, page, perPage, total } = withPage(all, sp);
  return (
    <div className="space-y-3">
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
      <AdminPagination total={total} page={page} perPage={perPage} />
    </div>
  );
}

// ---------- Brand-wise ----------
async function BrandReport({ from, to, sort, sp }: { from?: Date; to?: Date; sort?: BrandSort; sp: PageSp }) {
  const all = await getBrandSalesReport(from, to, { sort });
  const { rows, page, perPage, total } = withPage(all, sp);
  return (
    <div className="space-y-3">
      <ReportTable
        testId="report-brands"
        head={["Brand", "Orders", "Units Sold", "Revenue", "Profit", "Margin"]}
        empty="No brand sales in range."
        rows={rows.map((r) => (
          <tr key={r.brand} className="bg-surface">
            <td className="px-3 py-2 font-medium">{r.brand}</td>
            <td className="px-3 py-2">{r.orders}</td>
            <td className="px-3 py-2">{r.unitsSold}</td>
            <td className="px-3 py-2 font-medium text-accent">{formatBDT(r.revenue)}</td>
            <td className={cn("px-3 py-2 font-medium", r.profit.isNegative() ? "text-red-600" : "text-green-600")}>{formatBDT(r.profit)}</td>
            <td className={cn("px-3 py-2 font-medium", r.margin < 0 ? "text-red-600" : "text-green-600")}>{pct(r.margin)}</td>
          </tr>
        ))}
      />
      <AdminPagination total={total} page={page} perPage={perPage} />
    </div>
  );
}

// ---------- Profit & Loss ----------
async function ProfitLossReport({ from, to }: { from?: Date; to?: Date }) {
  const p = await getProfitLoss(from, to);
  const lines: { label: string; value: string; tone?: "add" | "sub" | "total" }[] = [
    { label: "Gross Revenue", value: formatBDT(p.grossRevenue) },
    { label: "− Cost of Goods (product cost)", value: formatBDT(p.productCost), tone: "sub" },
    { label: "= Gross Profit", value: formatBDT(p.grossProfit), tone: "total" },
    { label: "− Discounts given", value: formatBDT(p.discounts), tone: "sub" },
    { label: "= Net Profit", value: formatBDT(p.netProfit), tone: "total" },
  ];

  return (
    <div className="space-y-4" data-testid="report-pnl">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Gross Revenue" value={formatBDT(p.grossRevenue)} tone="accent" />
        <Kpi label="Net Profit" value={formatBDT(p.netProfit)} tone="profit" testId="pnl-net" />
        <Kpi label="Net Margin" value={pct(p.netMargin)} tone="profit" />
        <Kpi label="Orders" value={String(p.orders)} />
      </div>

      <div className="overflow-hidden rounded-lg border border-hairline bg-surface">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-hairline">
            {lines.map((l) => (
              <tr key={l.label} className={l.tone === "total" ? "bg-surface-2" : ""}>
                <td className={cn("px-4 py-2.5", l.tone === "total" ? "font-bold text-ink" : "text-muted")}>{l.label}</td>
                <td
                  className={cn(
                    "px-4 py-2.5 text-right font-semibold tabular-nums",
                    l.tone === "sub" ? "text-red-600" : l.tone === "total" ? "text-ink" : "text-ink",
                  )}
                >
                  {l.tone === "sub" ? `(${l.value})` : l.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <Stat label="Items sold" value={String(p.itemsSold)} />
        <Stat label="Shipping collected" value={formatBDT(p.shippingCollected)} />
        <Stat label="Net margin" value={pct(p.netMargin)} />
      </div>

      <p className="text-xs text-muted">
        <strong>Net Profit</strong> = Gross Revenue − Product Cost (COGS) − Discounts. Excludes cancelled
        orders. Shipping is collected from customers and typically passed to the courier, so it&apos;s shown
        separately rather than as profit.
      </p>
    </div>
  );
}

// ---------- Customer Purchase ----------
async function CustomerReport({ from, to, sort, sp }: { from?: Date; to?: Date; sort?: CustomerSort; sp: PageSp }) {
  const all = await getCustomerPurchaseReport(from, to, { sort });
  const { rows, page, perPage, total } = withPage(all, sp);
  return (
    <div className="space-y-3">
      <ReportTable
        testId="report-customers"
        head={["Customer", "Contact", "Orders", "Total Spend", "Avg Order", "Last Purchase"]}
        empty="No customer purchases in range."
        rows={rows.map((r, i) => (
          <tr key={`${r.name}-${r.contact}-${i}`} className="bg-surface">
            <td className="px-3 py-2 font-medium">
              {r.name}
              {r.guest && <span className="ml-1 text-[10px] font-normal text-muted">(Guest)</span>}
            </td>
            <td className="px-3 py-2 text-muted">{r.contact}</td>
            <td className="px-3 py-2">{r.totalOrders}</td>
            <td className="px-3 py-2 font-medium text-accent">{formatBDT(r.totalSpend)}</td>
            <td className="px-3 py-2">{formatBDT(r.avgOrderValue)}</td>
            <td className="px-3 py-2 text-muted">{formatDate(r.lastPurchase)}</td>
          </tr>
        ))}
      />
      <AdminPagination total={total} page={page} perPage={perPage} />
    </div>
  );
}

// ---------- 4. Orders (existing list + low stock) ----------
async function OrdersReport({
  from,
  to,
  status,
  orderNumber,
  customer,
  sp,
}: {
  from?: Date;
  to?: Date;
  status?: OrderStatus;
  orderNumber?: string;
  customer?: string;
  sp: { page?: string; perPage?: string };
}) {
  const { page, perPage, skip, take } = parsePageParams(sp);
  const [report, lowStock] = await Promise.all([
    getSalesReport(from, to, { status, orderNumber, customer }),
    getInventory(true),
  ]);
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
                  <td className="px-3 py-2 text-muted">{formatDate(o.createdAt)}</td>
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

// Text search filter for the GET form (submits on Enter or the Apply button).
function FilterText({
  name,
  label,
  defaultValue,
  placeholder,
  testId,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  testId?: string;
}) {
  return (
    <label className="flex flex-col">
      <span className="text-xs text-muted">{label}</span>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        data-testid={testId}
        className="min-w-[9.5rem] rounded-lg border border-hairline-strong bg-surface px-3 py-2 text-sm text-ink transition-colors placeholder:text-muted hover:border-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
    </label>
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
