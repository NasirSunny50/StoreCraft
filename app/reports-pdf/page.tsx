import type { OrderStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth-guard";
import { getBranding } from "@/lib/branding";
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
import { formatBDT } from "@/lib/utils/money";
import { formatDate } from "@/lib/utils/date";
import { PrintControls } from "@/components/admin/print-controls";

export const metadata = { title: "Report — PDF" };

const TITLES: Record<string, string> = {
  summary: "Sales Summary Report",
  products: "Product-wise Sales Report",
  categories: "Category-wise Sales Report",
  brands: "Brand-wise Sales Report",
  pnl: "Profit & Loss Report",
  customers: "Customer Purchase Report",
  orders: "Orders Report",
};

const pct = (r: number) => `${(r * 100).toFixed(1)}%`;

const PRODUCT_SORTS = ["revenue", "profit", "margin", "qty"] as const;
const CATEGORY_SORTS = ["revenue", "profit", "margin"] as const;
const BRAND_SORTS = ["revenue", "profit", "units", "margin"] as const;
const CUSTOMER_SORTS = ["spend", "orders", "aov", "recent"] as const;
const ORDER_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"] as const;

export default async function ReportsPdfPage({
  searchParams,
}: {
  searchParams: Promise<{
    report?: string;
    from?: string;
    to?: string;
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
  const report = TITLES[sp.report ?? ""] ? sp.report! : "summary";
  const from = sp.from ? new Date(sp.from) : undefined;
  const to = sp.to ? new Date(`${sp.to}T23:59:59`) : undefined;
  const has = (arr: readonly string[], v?: string) => !!v && arr.includes(v);
  const cat = sp.cat || undefined;
  const product = sp.product || undefined;
  const orderNo = sp.order?.trim() || undefined;
  const customer = sp.customer?.trim() || undefined;
  const productSort = has(PRODUCT_SORTS, sp.sort) ? (sp.sort as ProductSort) : undefined;
  const categorySort = has(CATEGORY_SORTS, sp.sort) ? (sp.sort as CategorySort) : undefined;
  const brandSort = has(BRAND_SORTS, sp.sort) ? (sp.sort as BrandSort) : undefined;
  const customerSort = has(CUSTOMER_SORTS, sp.sort) ? (sp.sort as CustomerSort) : undefined;
  const status = has(ORDER_STATUSES, sp.status) ? (sp.status as OrderStatus) : undefined;
  const b = await getBranding();

  const rangeLabel =
    sp.from || sp.to
      ? `${sp.from ? formatDate(sp.from) : "Beginning"} — ${sp.to ? formatDate(sp.to) : "Today"}`
      : "All time";

  // Same report params → CSV export link for the "Download CSV" button.
  const csvParams = new URLSearchParams();
  csvParams.set("report", report);
  if (sp.from) csvParams.set("from", sp.from);
  if (sp.to) csvParams.set("to", sp.to);
  if (cat) csvParams.set("cat", cat);
  if (product) csvParams.set("product", product);
  if (sp.sort) csvParams.set("sort", sp.sort);
  if (orderNo) csvParams.set("order", orderNo);
  if (customer) csvParams.set("customer", customer);
  if (status) csvParams.set("status", status);
  const csvHref = `/api/admin/reports/sales.csv?${csvParams.toString()}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 text-ink print:max-w-none print:p-0">
      {/* Header lives in <thead>, footer in <tfoot> — browsers repeat those on
          every printed page, so multi-page PDFs keep the header & footer. */}
      <style>{`
        @media print {
          @page { margin: 1.2cm; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
        }
      `}</style>

      <PrintControls csvHref={csvHref} />

      <table className="report-doc w-full border-collapse overflow-hidden rounded-xl border border-hairline bg-surface shadow-card print:rounded-none print:border-0 print:shadow-none">
        {/* ---------- Header (repeats every printed page) ---------- */}
        <thead>
          <tr>
            <td className="p-0">
              <div className="border-b-4 border-accent bg-surface px-6 py-5 sm:px-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-2xl font-extrabold tracking-tight text-accent">{b.shopName}</div>
                    {b.tagline && <p className="text-xs text-muted">{b.tagline}</p>}
                    <p className="mt-1 text-[11px] text-muted">
                      {[b.hotline && `Hotline ${b.hotline}`, b.contactEmail].filter(Boolean).join("  ·  ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block rounded bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent">
                      Business Report
                    </span>
                    <h1 className="mt-1.5 text-lg font-bold text-ink sm:text-xl">{TITLES[report]}</h1>
                    <p className="text-xs text-muted">Period: {rangeLabel}</p>
                    <p className="text-[11px] text-muted">Generated: {new Date().toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </thead>

        {/* ---------- Footer (repeats every printed page) ---------- */}
        <tfoot>
          <tr>
            <td className="p-0">
              <div className="border-t border-hairline bg-surface-2 px-6 py-3 text-[10px] text-muted sm:px-8 print:bg-transparent">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {b.shopName}
                    {b.address ? ` · ${b.address}` : ""}
                  </span>
                  <span className="font-medium">Confidential — for internal business use only</span>
                </div>
              </div>
            </td>
          </tr>
        </tfoot>

        {/* ---------- Body ---------- */}
        <tbody>
          <tr>
            <td className="p-0">
              <div className="space-y-5 px-6 py-6 sm:px-8">
                {report === "summary" && <SummaryPdf from={from} to={to} />}
                {report === "products" && <ProductsPdf from={from} to={to} categorySlug={cat} productId={product} sort={productSort} />}
                {report === "categories" && <CategoriesPdf from={from} to={to} categorySlug={cat} sort={categorySort} />}
                {report === "brands" && <BrandsPdf from={from} to={to} sort={brandSort} />}
                {report === "pnl" && <ProfitLossPdf from={from} to={to} />}
                {report === "customers" && <CustomersPdf from={from} to={to} sort={customerSort} />}
                {report === "orders" && <OrdersPdf from={from} to={to} status={status} orderNumber={orderNo} customer={customer} />}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ---------- shared table styling ----------
const th = "border-b-2 border-hairline-strong px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-muted";
const thNum = `${th} text-right`;
const td = "border-b border-hairline px-3 py-2 text-sm";
const tdNum = `${td} text-right tabular-nums`;

function Scroll({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

// ---------- 1. Summary ----------
async function SummaryPdf({ from, to }: { from?: Date; to?: Date }) {
  const s = await getSalesSummary(from, to);
  return (
    <>
      {/* Highlight KPIs — sales + profit */}
      <div className="grid grid-cols-3 gap-3">
        <Hero label="Total Sales" value={formatBDT(s.totalSales)} />
        <Hero label="Gross Profit" value={formatBDT(s.grossProfit)} />
        <Hero label="Profit Margin" value={pct(s.profitMargin)} />
      </div>
      <Scroll>
        <table className="w-full border-collapse">
          <tbody>
            {(
              [
                ["Total Orders", String(s.totalOrders)],
                ["Gross Revenue (before discount)", formatBDT(s.grossRevenue)],
                ["Cost of Goods Sold (COGS)", formatBDT(s.totalCost)],
                ["Gross Profit", formatBDT(s.grossProfit)],
                ["Profit Margin", pct(s.profitMargin)],
                ["Net Revenue (after discount)", formatBDT(s.netRevenue)],
                ["Average Order Value", formatBDT(s.avgOrderValue)],
                ["Total Discount Given", formatBDT(s.totalDiscount)],
                ["Shipping Collected", formatBDT(s.totalShipping)],
                ["Items Sold", String(s.itemsSold)],
                ["Paid Orders", `${s.paidOrders}  ·  ${formatBDT(s.paidSales)}`],
                ["Cash on Delivery / Online", `${s.codOrders} / ${s.onlineOrders}`],
                ["Cancelled Orders", String(s.cancelledOrders)],
                ["Cancellation Rate", pct(s.cancellationRate)],
              ] as [string, string][]
            ).map(([k, v], i) => (
              <tr key={k} className={i % 2 ? "bg-surface-2" : ""}>
                <td className={`${td} font-medium text-muted`}>{k}</td>
                <td className={`${tdNum} font-semibold text-ink`}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Scroll>
      <Note>
        Gross Profit = Gross Revenue − COGS (buying price × qty) · Profit Margin = Gross Profit ÷ Gross
        Revenue · Net = after discount · Total Sales = amount payable (incl. shipping). Excludes cancelled orders.
      </Note>
    </>
  );
}

// ---------- 2. Products ----------
async function ProductsPdf({
  from,
  to,
  categorySlug,
  productId,
  sort,
}: {
  from?: Date;
  to?: Date;
  categorySlug?: string;
  productId?: string;
  sort?: ProductSort;
}) {
  const rows = await getProductSalesReport(from, to, { categorySlug, productId, sort });
  return (
    <>
      <Scroll>
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr>
              <th className={th}>#</th>
              <th className={th}>Product</th>
              <th className={th}>Category</th>
              <th className={thNum}>Qty Sold</th>
              <th className={thNum}>Revenue</th>
              <th className={thNum}>Profit</th>
              <th className={thNum}>Margin</th>
              <th className={thNum}>Cancel %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.productId} className={i % 2 ? "bg-surface-2" : ""}>
                <td className={`${td} text-muted`}>{i + 1}</td>
                <td className={`${td} font-medium`}>{r.name}</td>
                <td className={`${td} text-muted`}>{r.category}</td>
                <td className={tdNum}>{r.soldQty}</td>
                <td className={`${tdNum} font-semibold`}>{formatBDT(r.revenue)}</td>
                <td className={tdNum}>{formatBDT(r.profit)}</td>
                <td className={tdNum}>{pct(r.margin)}</td>
                <td className={tdNum}>{pct(r.cancellationRate)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td className={`${td} text-center text-muted`} colSpan={8}>No product sales in range.</td></tr>}
          </tbody>
        </table>
      </Scroll>
      <Note>Profit = Revenue − (cost price × qty), using current product cost prices. Cancel % = share of ordered units later cancelled.</Note>
    </>
  );
}

// ---------- 3. Categories ----------
async function CategoriesPdf({ from, to, categorySlug, sort }: { from?: Date; to?: Date; categorySlug?: string; sort?: CategorySort }) {
  const rows = await getCategorySalesReport(from, to, { categorySlug, sort });
  return (
    <Scroll>
      <table className="w-full min-w-[480px] border-collapse">
        <thead>
          <tr>
            <th className={th}>Category</th>
            <th className={thNum}>Orders</th>
            <th className={thNum}>Items Sold</th>
            <th className={thNum}>Revenue</th>
            <th className={thNum}>Profit</th>
            <th className={thNum}>Margin</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.category} className={i % 2 ? "bg-surface-2" : ""}>
              <td className={`${td} font-medium`}>{r.category}</td>
              <td className={tdNum}>{r.orders}</td>
              <td className={tdNum}>{r.itemsSold}</td>
              <td className={`${tdNum} font-semibold`}>{formatBDT(r.revenue)}</td>
              <td className={tdNum}>{formatBDT(r.profit)}</td>
              <td className={tdNum}>{pct(r.margin)}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td className={`${td} text-center text-muted`} colSpan={6}>No category sales in range.</td></tr>}
        </tbody>
      </table>
    </Scroll>
  );
}

// ---------- Brands ----------
async function BrandsPdf({ from, to, sort }: { from?: Date; to?: Date; sort?: BrandSort }) {
  const rows = await getBrandSalesReport(from, to, { sort });
  return (
    <Scroll>
      <table className="w-full min-w-[480px] border-collapse">
        <thead>
          <tr>
            <th className={th}>Brand</th>
            <th className={thNum}>Orders</th>
            <th className={thNum}>Units Sold</th>
            <th className={thNum}>Revenue</th>
            <th className={thNum}>Profit</th>
            <th className={thNum}>Margin</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.brand} className={i % 2 ? "bg-surface-2" : ""}>
              <td className={`${td} font-medium`}>{r.brand}</td>
              <td className={tdNum}>{r.orders}</td>
              <td className={tdNum}>{r.unitsSold}</td>
              <td className={`${tdNum} font-semibold`}>{formatBDT(r.revenue)}</td>
              <td className={tdNum}>{formatBDT(r.profit)}</td>
              <td className={tdNum}>{pct(r.margin)}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td className={`${td} text-center text-muted`} colSpan={6}>No brand sales in range.</td></tr>}
        </tbody>
      </table>
    </Scroll>
  );
}

// ---------- Profit & Loss ----------
async function ProfitLossPdf({ from, to }: { from?: Date; to?: Date }) {
  const p = await getProfitLoss(from, to);
  const lines: [string, string, boolean?][] = [
    ["Gross Revenue", formatBDT(p.grossRevenue)],
    ["Less: Cost of Goods (product cost)", formatBDT(p.productCost)],
    ["Gross Profit", formatBDT(p.grossProfit), true],
    ["Less: Discounts given", formatBDT(p.discounts)],
    ["Net Profit", formatBDT(p.netProfit), true],
  ];
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <Hero label="Gross Revenue" value={formatBDT(p.grossRevenue)} />
        <Hero label="Net Profit" value={formatBDT(p.netProfit)} />
        <Hero label="Net Margin" value={pct(p.netMargin)} />
      </div>
      <Scroll>
        <table className="w-full border-collapse">
          <tbody>
            {lines.map(([k, v, strong]) => (
              <tr key={k} className={strong ? "bg-surface-2" : ""}>
                <td className={`${td} ${strong ? "font-bold text-ink" : "font-medium text-muted"}`}>{k}</td>
                <td className={`${tdNum} font-semibold text-ink`}>{v}</td>
              </tr>
            ))}
            <tr>
              <td className={`${td} font-medium text-muted`}>Shipping collected (pass-through)</td>
              <td className={`${tdNum} text-ink`}>{formatBDT(p.shippingCollected)}</td>
            </tr>
          </tbody>
        </table>
      </Scroll>
      <Note>
        Net Profit = Gross Revenue − Product Cost (COGS) − Discounts. Excludes cancelled orders. Shipping is
        collected from customers and typically passed to the courier, so it is shown separately.
      </Note>
    </>
  );
}

// ---------- Customers ----------
async function CustomersPdf({ from, to, sort }: { from?: Date; to?: Date; sort?: CustomerSort }) {
  const rows = await getCustomerPurchaseReport(from, to, { sort });
  return (
    <Scroll>
      <table className="w-full min-w-[620px] border-collapse">
        <thead>
          <tr>
            <th className={th}>Customer</th>
            <th className={th}>Contact</th>
            <th className={thNum}>Orders</th>
            <th className={thNum}>Total Spend</th>
            <th className={thNum}>Avg Order</th>
            <th className={th}>Last Purchase</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.name}-${r.contact}-${i}`} className={i % 2 ? "bg-surface-2" : ""}>
              <td className={`${td} font-medium`}>{r.name}{r.guest ? " (Guest)" : ""}</td>
              <td className={`${td} text-muted`}>{r.contact}</td>
              <td className={tdNum}>{r.totalOrders}</td>
              <td className={`${tdNum} font-semibold`}>{formatBDT(r.totalSpend)}</td>
              <td className={tdNum}>{formatBDT(r.avgOrderValue)}</td>
              <td className={`${td} text-muted`}>{formatDate(r.lastPurchase)}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td className={`${td} text-center text-muted`} colSpan={6}>No customer purchases in range.</td></tr>}
        </tbody>
      </table>
    </Scroll>
  );
}

// ---------- 4. Orders ----------
async function OrdersPdf({
  from,
  to,
  status,
  orderNumber,
  customer,
}: {
  from?: Date;
  to?: Date;
  status?: OrderStatus;
  orderNumber?: string;
  customer?: string;
}) {
  const { orders, total } = await getSalesReport(from, to, { status, orderNumber, customer });
  return (
    <Scroll>
      <table className="w-full min-w-[560px] border-collapse">
        <thead>
          <tr>
            <th className={th}>Order</th>
            <th className={th}>Customer</th>
            <th className={th}>Status</th>
            <th className={thNum}>Total</th>
            <th className={th}>Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o, i) => (
            <tr key={o.id} className={i % 2 ? "bg-surface-2" : ""}>
              <td className={`${td} font-medium`}>{o.orderNumber}</td>
              <td className={td}>{o.user?.name ?? `${o.address.fullName} (Guest)`}</td>
              <td className={`${td} text-muted`}>{o.status}</td>
              <td className={`${tdNum} font-semibold`}>{formatBDT(o.total)}</td>
              <td className={`${td} text-muted`}>{formatDate(o.createdAt)}</td>
            </tr>
          ))}
          {orders.length === 0 && <tr><td className={`${td} text-center text-muted`} colSpan={5}>No sales in range.</td></tr>}
        </tbody>
        {orders.length > 0 && (
          <tfoot>
            <tr>
              <td className={`${td} font-bold`} colSpan={3}>Total</td>
              <td className={`${tdNum} font-bold text-accent`}>{formatBDT(total)}</td>
              <td className={td} />
            </tr>
          </tfoot>
        )}
      </table>
    </Scroll>
  );
}

// ---------- small helpers ----------
function Hero({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-2 p-3 text-center print:bg-transparent">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-base font-extrabold text-ink sm:text-lg">{value}</div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] leading-relaxed text-muted">{children}</p>;
}
