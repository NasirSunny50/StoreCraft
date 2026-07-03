import Link from "next/link";
import { ChevronRight, PackageOpen } from "lucide-react";
import { requireAuth } from "@/lib/auth-guard";
import { getUserOrders } from "@/lib/queries/order";
import { paymentMethodLabel } from "@/lib/order-math";
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
    <div>
      {/* Breadcrumb */}
      <nav className="mb-2 flex items-center gap-1 text-xs text-muted">
        <Link href="/" className="hover:text-accent">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-ink">My Orders</span>
      </nav>

      <h1 className="mb-4 text-2xl font-bold text-ink md:text-3xl">My Orders</h1>

      {items.length === 0 ? (
        <div className="space-y-4 rounded-lg border border-hairline bg-surface py-16 text-center" data-testid="orders-empty">
          <PackageOpen className="mx-auto h-12 w-12 text-muted" strokeWidth={1.25} />
          <p className="font-medium text-ink">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/products"
            className="inline-block rounded-full bg-accent px-8 py-2.5 font-medium text-white hover:bg-accent-strong"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.orderNumber}`}
              data-testid="order-row"
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-hairline bg-surface p-4 transition-colors hover:border-accent"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
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
                <div className="text-xs text-muted">{paymentMethodLabel(order.paymentMethod)}</div>
              </div>
            </Link>
          ))}

          {nextCursor && (
            <div className="pt-2 text-center">
              <Link
                href={`/orders?cursor=${nextCursor}`}
                className="inline-block rounded-full border border-accent px-8 py-2 text-sm font-medium text-accent hover:bg-accent hover:text-white"
              >
                Older orders
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
