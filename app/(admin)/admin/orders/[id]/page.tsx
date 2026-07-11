import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/lib/auth-guard";
import { getAdminOrder } from "@/lib/queries/admin-misc";
import { formatBDT } from "@/lib/utils/money";
import { colorName } from "@/lib/utils/color";
import { AdminPageHeader } from "@/components/admin/page-header";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { OrderStatusForm } from "@/components/admin/order-status-form";

export const metadata = { title: "Order — Admin" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();
  const a = order.address;

  return (
    <div>
      <AdminPageHeader title={order.orderNumber} testId="admin-heading">
        <Link href="/admin/orders" className="text-xs text-link hover:underline">← All orders</Link>
      </AdminPageHeader>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="rounded border border-hairline bg-surface">
            <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
              <h2 className="text-sm font-bold">Items</h2>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="divide-y divide-hairline">
              {order.items.map((it) => (
                <div key={it.id} className="flex justify-between px-4 py-2.5 text-sm">
                  <span>{it.name} <span className="text-muted">× {it.quantity}{it.color ? ` · ${colorName(it.color)}` : ""}</span></span>
                  <span className="font-medium">{formatBDT(it.price.times(it.quantity))}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1 border-t border-hairline px-4 py-3 text-sm">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatBDT(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Shipping</span><span>{formatBDT(order.shippingFee)}</span></div>
              {order.discount.greaterThan(0) && (
                <div className="flex justify-between"><span className="text-muted">Discount</span><span>− {formatBDT(order.discount)}</span></div>
              )}
              <div className="flex justify-between border-t border-hairline pt-2 font-bold"><span>Total</span><span className="text-accent">{formatBDT(order.total)}</span></div>
            </div>
          </div>

          <div className="rounded border border-hairline bg-surface p-4">
            <h2 className="mb-2 text-sm font-bold">Status history</h2>
            <ul className="space-y-1.5 text-sm" data-testid="status-log">
              {order.statusLogs.map((log) => (
                <li key={log.id} className="flex items-center gap-2">
                  <OrderStatusBadge status={log.status} />
                  <span className="text-muted">{new Date(log.createdAt).toLocaleString()}</span>
                  {log.note && <span className="text-ink">— {log.note}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded border border-hairline bg-surface p-4 text-sm">
            <h2 className="mb-2 text-sm font-bold">Update Status</h2>
            <OrderStatusForm
              orderId={order.id}
              current={order.status}
              tracking={{
                carrier: order.trackingCarrier,
                number: order.trackingNumber,
                url: order.trackingUrl,
              }}
            />
          </div>
          <div className="rounded border border-hairline bg-surface p-4 text-sm">
            <h2 className="mb-2 text-sm font-bold">Customer</h2>
            <div className="font-medium">{order.user.name}</div>
            <div className="text-muted">{order.user.phone ?? "—"}</div>
            <div className="text-muted">{order.user.email ?? "— no email —"}</div>
          </div>
          <div className="rounded border border-hairline bg-surface p-4 text-sm">
            <h2 className="mb-2 text-sm font-bold">Delivery Address</h2>
            <div className="font-medium">{a.fullName}</div>
            <div className="text-muted">{a.phone}</div>
            <div className="text-muted">{[a.line1, a.line2, a.area, a.city, a.postcode].filter(Boolean).join(", ")}</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
