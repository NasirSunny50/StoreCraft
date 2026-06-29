import Link from "next/link";
import { requireAuth } from "@/lib/auth-guard";
import { getUserOrders } from "@/lib/queries/order";
import { formatBDT } from "@/lib/utils/money";
import { OrderStatusBadge } from "@/components/order/order-status-badge";

export const metadata = { title: "My Orders — StoreCraft" };

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const session = await requireAuth();
  const { cursor } = await searchParams;
  const { items, nextCursor } = await getUserOrders(session.user.id, cursor);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">My Orders</h1>

      {items.length === 0 ? (
        <div className="space-y-3 rounded border border-hairline bg-surface py-12 text-center" data-testid="orders-empty">
          <p className="font-medium">You haven&apos;t placed any orders yet.</p>
          <Link href="/products" className="text-link hover:underline">
            Start shopping →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.orderNumber}`}
              data-testid="order-row"
              className="flex items-center justify-between gap-4 rounded border border-hairline bg-surface p-4 hover:border-accent"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-ink">{order.orderNumber}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="mt-1 text-xs text-muted">
                  {new Date(order.createdAt).toLocaleDateString()} ·{" "}
                  {order.items.length} item{order.items.length > 1 ? "s" : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-accent">{formatBDT(order.total)}</div>
                <div className="text-xs text-muted">Cash on Delivery</div>
              </div>
            </Link>
          ))}

          {nextCursor && (
            <div className="pt-2 text-center">
              <Link
                href={`/orders?cursor=${nextCursor}`}
                className="text-sm text-link hover:underline"
              >
                Older orders →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
