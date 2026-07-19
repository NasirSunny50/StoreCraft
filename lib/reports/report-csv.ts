import type { OrderStatus } from "@prisma/client";
import { getBranding } from "@/lib/branding";
import { formatDate } from "@/lib/utils/date";
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

const TITLES: Record<string, string> = {
  summary: "Sales Summary Report",
  products: "Product-wise Sales Report",
  categories: "Category-wise Sales Report",
  brands: "Brand-wise Sales Report",
  pnl: "Profit & Loss Report",
  customers: "Customer Purchase Report",
  orders: "Orders Report",
};

const PRODUCT_SORTS = ["revenue", "profit", "margin", "qty"] as const;
const CATEGORY_SORTS = ["revenue", "profit", "margin"] as const;
const BRAND_SORTS = ["revenue", "profit", "units", "margin"] as const;
const CUSTOMER_SORTS = ["spend", "orders", "aov", "recent"] as const;
const ORDER_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"] as const;

function cell(v: string): string {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const pct = (r: number) => `${(r * 100).toFixed(1)}%`;

/**
 * Build a report CSV (filename + content) from the export query params. The
 * output is wrapped with a header block (shop, report title, period) and a
 * footer so the downloaded file matches the on-screen / PDF report.
 */
export async function buildReportCsv(
  params: URLSearchParams,
): Promise<{ filename: string; csv: string }> {
  const report = params.get("report") ?? "orders";
  const from = params.get("from");
  const to = params.get("to");
  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(`${to}T23:59:59`) : undefined;

  const catParam = params.get("cat") || undefined;
  const productParam = params.get("product") || undefined;
  const orderParam = params.get("order")?.trim() || undefined;
  const customerParam = params.get("customer")?.trim() || undefined;
  const sortParam = params.get("sort") ?? undefined;
  const statusParam = params.get("status") ?? undefined;
  const has = (arr: readonly string[], v?: string) => !!v && arr.includes(v);
  const productSort = has(PRODUCT_SORTS, sortParam) ? (sortParam as ProductSort) : undefined;
  const categorySort = has(CATEGORY_SORTS, sortParam) ? (sortParam as CategorySort) : undefined;
  const brandSort = has(BRAND_SORTS, sortParam) ? (sortParam as BrandSort) : undefined;
  const customerSort = has(CUSTOMER_SORTS, sortParam) ? (sortParam as CustomerSort) : undefined;
  const status = has(ORDER_STATUSES, statusParam) ? (statusParam as OrderStatus) : undefined;

  let rows: string[][];
  let filename: string;

  if (report === "summary") {
    const s = await getSalesSummary(fromDate, toDate);
    filename = "sales-summary";
    rows = [
      ["Metric", "Value"],
      ["Total Orders", String(s.totalOrders)],
      ["Total Sales", s.totalSales.toString()],
      ["Gross Revenue", s.grossRevenue.toString()],
      ["Cost of Goods Sold (COGS)", s.totalCost.toString()],
      ["Gross Profit", s.grossProfit.toString()],
      ["Profit Margin", pct(s.profitMargin)],
      ["Net Revenue", s.netRevenue.toString()],
      ["Average Order Value", s.avgOrderValue.toFixed(2)],
      ["Items Sold", String(s.itemsSold)],
      ["Total Discount", s.totalDiscount.toString()],
      ["Shipping Collected", s.totalShipping.toString()],
      ["Paid Orders", String(s.paidOrders)],
      ["Paid Sales", s.paidSales.toString()],
      ["COD Orders", String(s.codOrders)],
      ["Online Orders", String(s.onlineOrders)],
      ["Cancelled Orders", String(s.cancelledOrders)],
      ["Cancellation Rate", pct(s.cancellationRate)],
    ];
  } else if (report === "products") {
    const data = await getProductSalesReport(fromDate, toDate, { categorySlug: catParam, productId: productParam, sort: productSort });
    filename = "product-sales";
    rows = [["Product", "Category", "Qty Sold", "Revenue", "Profit", "Margin", "Cancellation Rate"]];
    for (const r of data) {
      rows.push([r.name, r.category, String(r.soldQty), r.revenue.toString(), r.profit.toString(), pct(r.margin), pct(r.cancellationRate)]);
    }
  } else if (report === "categories") {
    const data = await getCategorySalesReport(fromDate, toDate, { categorySlug: catParam, sort: categorySort });
    filename = "category-sales";
    rows = [["Category", "Orders", "Items Sold", "Revenue", "Profit", "Margin"]];
    for (const r of data) {
      rows.push([r.category, String(r.orders), String(r.itemsSold), r.revenue.toString(), r.profit.toString(), pct(r.margin)]);
    }
  } else if (report === "brands") {
    const data = await getBrandSalesReport(fromDate, toDate, { sort: brandSort });
    filename = "brand-sales";
    rows = [["Brand", "Orders", "Units Sold", "Revenue", "Profit", "Margin"]];
    for (const r of data) {
      rows.push([r.brand, String(r.orders), String(r.unitsSold), r.revenue.toString(), r.profit.toString(), pct(r.margin)]);
    }
  } else if (report === "pnl") {
    const p = await getProfitLoss(fromDate, toDate);
    filename = "profit-and-loss";
    rows = [
      ["Line", "Amount"],
      ["Gross Revenue", p.grossRevenue.toString()],
      ["Cost of Goods (product cost)", p.productCost.toString()],
      ["Gross Profit", p.grossProfit.toString()],
      ["Discounts Given", p.discounts.toString()],
      ["Net Profit", p.netProfit.toString()],
      ["Net Margin", pct(p.netMargin)],
      ["Shipping Collected", p.shippingCollected.toString()],
      ["Orders", String(p.orders)],
      ["Items Sold", String(p.itemsSold)],
    ];
  } else if (report === "customers") {
    const data = await getCustomerPurchaseReport(fromDate, toDate, { sort: customerSort });
    filename = "customer-purchases";
    rows = [["Customer", "Contact", "Type", "Total Orders", "Total Spend", "Avg Order Value", "First Purchase", "Last Purchase"]];
    for (const r of data) {
      rows.push([
        r.name,
        r.contact,
        r.guest ? "Guest" : "Account",
        String(r.totalOrders),
        r.totalSpend.toString(),
        r.avgOrderValue.toFixed(2),
        r.firstPurchase.toISOString().slice(0, 10),
        r.lastPurchase.toISOString().slice(0, 10),
      ]);
    }
  } else {
    const report2 = await getSalesReport(fromDate, toDate, { status, orderNumber: orderParam, customer: customerParam });
    filename = "sales-report";
    rows = [["Order Number", "Date", "Customer", "Email", "Status", "Subtotal", "Discount", "Shipping", "Total"]];
    for (const o of report2.orders) {
      rows.push([
        o.orderNumber,
        o.createdAt.toISOString().slice(0, 10),
        o.user?.name ?? `${o.address.fullName} (Guest)`,
        o.user?.email ?? o.guestEmail ?? "",
        o.status,
        o.subtotal.toString(),
        o.discount.toString(),
        o.shippingFee.toString(),
        o.total.toString(),
      ]);
    }
    rows.push([]);
    rows.push(["", "", "", "", "", "", "", "TOTAL", report2.total.toString()]);
  }

  // Header + footer block so the CSV matches the on-screen / PDF report.
  const b = await getBranding();
  const rangeLabel =
    from || to
      ? `${from ? formatDate(from) : "Beginning"} - ${to ? formatDate(to) : "Today"}`
      : "All time";
  const preamble: string[][] = [
    [b.shopName],
    [TITLES[report] ?? "Report"],
    [`Period: ${rangeLabel}`],
    [`Generated: ${new Date().toLocaleString()}`],
    [],
  ];
  const footer: string[][] = [
    [],
    ["Confidential - for internal business use only"],
    [b.shopName + (b.address ? ` - ${b.address}` : "")],
  ];
  const finalRows = [...preamble, ...rows, ...footer];

  const csv = finalRows.map((r) => r.map(cell).join(",")).join("\r\n");
  return { filename, csv };
}
