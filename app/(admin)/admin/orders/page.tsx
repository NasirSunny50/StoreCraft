import Link from "next/link";
import type { OrderStatus } from "@prisma/client";
import { requireStaff } from "@/lib/auth-guard";
import { getAdminOrders } from "@/lib/queries/admin-misc";
import { formatBDT } from "@/lib/utils/money";
import { AdminPageHeader } from "@/components/admin/page-header";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { parsePageParams } from "@/lib/pagination";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Orders — Admin" };

const FILTERS: (OrderStatus | "ALL")[] = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; perPage?: string }>;
}) {
  await requireStaff();
  const sp = await searchParams;
  const active = (FILTERS.includes(sp.status as OrderStatus) ? sp.status : "ALL") as OrderStatus | "ALL";
  const { page, perPage, skip, take } = parsePageParams(sp);
  const { items: orders, total } = await getAdminOrders({
    status: active === "ALL" ? undefined : active,
    skip,
    take,
  });

  return (
    <div>
      <AdminPageHeader title="Orders" testId="admin-heading" />

      <div className="mb-3 flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "ALL" ? "/admin/orders" : `/admin/orders?status=${f}`}
            className={cn(
              "rounded px-3 py-1.5 text-xs font-medium",
              active === f ? "bg-accent text-white" : "bg-surface-2 text-muted hover:text-ink",
            )}
          >
            {f}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded border border-hairline">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Order</th>
              <th className="px-3 py-2 font-medium">Customer</th>
              <th className="px-3 py-2 font-medium">Items</th>
              <th className="px-3 py-2 font-medium">Total</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {orders.map((o) => (
              <tr key={o.id} className="bg-surface hover:bg-surface-2">
                <td className="px-3 py-2">
                  <Link href={`/admin/orders/${o.id}`} data-testid="admin-order-row" className="font-medium text-link hover:underline">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-3 py-2 text-muted">{o.user.name}<div className="text-xs">{o.user.email}</div></td>
                <td className="px-3 py-2 text-muted">{o._count.items}</td>
                <td className="px-3 py-2 font-medium text-accent">{formatBDT(o.total)}</td>
                <td className="px-3 py-2"><OrderStatusBadge status={o.status} /></td>
                <td className="px-3 py-2 text-muted">{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-muted">No orders.</td></tr>}
          </tbody>
        </table>
      </div>

      <AdminPagination total={total} page={page} perPage={perPage} />
    </div>
  );
}
