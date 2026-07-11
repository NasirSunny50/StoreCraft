import { auth } from "@/lib/auth";
import { getSalesReport } from "@/lib/queries/admin-dashboard";

function cell(v: string): string {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  // Route handlers aren't covered by the (admin) layout — guard explicitly.
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const report = await getSalesReport(
    from ? new Date(from) : undefined,
    to ? new Date(`${to}T23:59:59`) : undefined,
  );

  const rows: string[][] = [
    ["Order Number", "Date", "Customer", "Email", "Status", "Subtotal", "Discount", "Shipping", "Total"],
  ];
  for (const o of report.orders) {
    rows.push([
      o.orderNumber,
      o.createdAt.toISOString().slice(0, 10),
      o.user.name,
      o.user.email ?? "",
      o.status,
      o.subtotal.toString(),
      o.discount.toString(),
      o.shippingFee.toString(),
      o.total.toString(),
    ]);
  }
  rows.push([]);
  rows.push(["", "", "", "", "", "", "", "TOTAL", report.total.toString()]);

  const csv = rows.map((r) => r.map(cell).join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sales-report.csv"',
    },
  });
}
