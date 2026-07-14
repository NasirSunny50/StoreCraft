import { requireAdmin } from "@/lib/auth-guard";
import { getBranding } from "@/lib/branding";
import { getSalesReport } from "@/lib/queries/admin-dashboard";
import {
  getSalesSummary,
  getProductSalesReport,
  getCategorySalesReport,
} from "@/lib/queries/admin-reports";
import { formatBDT } from "@/lib/utils/money";
import { PrintControls } from "@/components/admin/print-controls";

export const metadata = { title: "Report — PDF" };

const TITLES: Record<string, string> = {
  summary: "Sales Summary Report",
  products: "Product-wise Sales Report",
  categories: "Category-wise Sales Report",
  orders: "Orders Report",
};

const pct = (r: number) => `${(r * 100).toFixed(1)}%`;

export default async function ReportsPdfPage({
  searchParams,
}: {
  searchParams: Promise<{ report?: string; from?: string; to?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const report = TITLES[sp.report ?? ""] ? sp.report! : "summary";
  const from = sp.from ? new Date(sp.from) : undefined;
  const to = sp.to ? new Date(`${sp.to}T23:59:59`) : undefined;
  const b = await getBranding();

  const rangeLabel = sp.from || sp.to ? `${sp.from ?? "Beginning"} — ${sp.to ?? "Today"}` : "All time";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 text-ink print:max-w-none print:p-0">
      <PrintControls />

      <article className="report-doc overflow-hidden rounded-xl border border-hairline bg-surface shadow-card print:rounded-none print:border-0 print:shadow-none">
        {/* ---------- Header ---------- */}
        <header className="border-b-4 border-accent bg-surface px-6 py-5 sm:px-8">
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
        </header>

        {/* ---------- Body ---------- */}
        <main className="space-y-5 px-6 py-6 sm:px-8">
          {report === "summary" && <SummaryPdf from={from} to={to} />}
          {report === "products" && <ProductsPdf from={from} to={to} />}
          {report === "categories" && <CategoriesPdf from={from} to={to} />}
          {report === "orders" && <OrdersPdf from={from} to={to} />}
        </main>

        {/* ---------- Footer ---------- */}
        <footer className="border-t border-hairline bg-surface-2 px-6 py-3 text-[10px] text-muted sm:px-8 print:bg-transparent">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              {b.shopName}
              {b.address ? ` · ${b.address}` : ""}
            </span>
            <span className="font-medium">Confidential — for internal business use only</span>
          </div>
        </footer>
      </article>
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
async function ProductsPdf({ from, to }: { from?: Date; to?: Date }) {
  const rows = await getProductSalesReport(from, to);
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
async function CategoriesPdf({ from, to }: { from?: Date; to?: Date }) {
  const rows = await getCategorySalesReport(from, to);
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

// ---------- 4. Orders ----------
async function OrdersPdf({ from, to }: { from?: Date; to?: Date }) {
  const { orders, total } = await getSalesReport(from, to);
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
              <td className={`${td} text-muted`}>{new Date(o.createdAt).toLocaleDateString()}</td>
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
