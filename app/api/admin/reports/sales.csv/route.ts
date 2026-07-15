import type { OrderStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { getSalesReport } from "@/lib/queries/admin-dashboard";
import {
  getSalesSummary,
  getProductSalesReport,
  getCategorySalesReport,
  type ProductSort,
  type CategorySort,
} from "@/lib/queries/admin-reports";

const PRODUCT_SORTS = ["revenue", "profit", "margin", "qty"] as const;
const CATEGORY_SORTS = ["revenue", "profit", "margin"] as const;
const ORDER_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"] as const;

function cell(v: string): string {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const pct = (r: number) => `${(r * 100).toFixed(1)}%`;

export async function GET(req: Request) {
  // Route handlers aren't covered by the (admin) layout — guard explicitly.
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(req.url);
  const report = url.searchParams.get("report") ?? "orders";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(`${to}T23:59:59`) : undefined;

  const catParam = url.searchParams.get("cat") ?? undefined;
  const sortParam = url.searchParams.get("sort") ?? undefined;
  const statusParam = url.searchParams.get("status") ?? undefined;
  const has = (arr: readonly string[], v?: string) => !!v && arr.includes(v);
  const productSort = has(PRODUCT_SORTS, sortParam) ? (sortParam as ProductSort) : undefined;
  const categorySort = has(CATEGORY_SORTS, sortParam) ? (sortParam as CategorySort) : undefined;
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
    const data = await getProductSalesReport(fromDate, toDate, { categorySlug: catParam, sort: productSort });
    filename = "product-sales";
    rows = [["Product", "Category", "Qty Sold", "Revenue", "Profit", "Margin", "Cancellation Rate"]];
    for (const r of data) {
      rows.push([r.name, r.category, String(r.soldQty), r.revenue.toString(), r.profit.toString(), pct(r.margin), pct(r.cancellationRate)]);
    }
  } else if (report === "categories") {
    const data = await getCategorySalesReport(fromDate, toDate, { sort: categorySort });
    filename = "category-sales";
    rows = [["Category", "Orders", "Items Sold", "Revenue", "Profit", "Margin"]];
    for (const r of data) {
      rows.push([r.category, String(r.orders), String(r.itemsSold), r.revenue.toString(), r.profit.toString(), pct(r.margin)]);
    }
  } else {
    const report2 = await getSalesReport(fromDate, toDate, status);
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

  const csv = rows.map((r) => r.map(cell).join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}
