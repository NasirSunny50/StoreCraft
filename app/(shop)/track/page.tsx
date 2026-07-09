import Link from "next/link";
import { Search, Truck, ExternalLink, PackageSearch } from "lucide-react";
import { getOrderForTracking } from "@/lib/queries/order";
import { ORDER_STATUS_FLOW } from "@/lib/order-math";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Track Order" };

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; phone?: string }>;
}) {
  const { order: orderNumber, phone } = await searchParams;
  const searched = Boolean(orderNumber && phone);
  const order = searched ? await getOrderForTracking(orderNumber!, phone!) : null;

  const inputCls =
    "w-full rounded-lg border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus:outline-none";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-ink md:text-2xl">
          <PackageSearch className="h-6 w-6 text-accent" /> Track Your Order
        </h1>
        <p className="mt-1 text-sm text-muted">
          Enter your order number and the phone number on the order to see its status.
        </p>
      </div>

      <form method="get" className="grid gap-3 rounded-lg border border-hairline bg-surface p-4 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label htmlFor="order" className="mb-1 block text-xs font-medium text-muted">Order number</label>
          <input
            id="order"
            name="order"
            required
            defaultValue={orderNumber ?? ""}
            placeholder="ORD-2026-0001"
            data-testid="track-order"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1 block text-xs font-medium text-muted">Phone number</label>
          <input
            id="phone"
            name="phone"
            required
            defaultValue={phone ?? ""}
            placeholder="01XXXXXXXXX"
            data-testid="track-phone"
            className={inputCls}
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            data-testid="track-submit"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 sm:w-auto"
          >
            <Search className="h-4 w-4" /> Track
          </button>
        </div>
      </form>

      {searched && !order && (
        <div
          data-testid="track-notfound"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          No order matched that order number and phone. Double-check both and try again —
          or <Link href="/orders" className="font-medium underline">sign in</Link> to see all your orders.
        </div>
      )}

      {order && (
        <div data-testid="track-result" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-ink">{order.orderNumber}</h2>
            <OrderStatusBadge status={order.status} />
          </div>

          {/* Status timeline */}
          <div className="rounded-lg border border-hairline bg-surface p-4">
            {order.status === "CANCELLED" ? (
              <p className="text-sm font-medium text-accent">This order was cancelled.</p>
            ) : (
              <ol className="flex items-center" data-testid="track-timeline">
                {ORDER_STATUS_FLOW.map((step, i) => {
                  const done = i <= ORDER_STATUS_FLOW.indexOf(order.status);
                  return (
                    <li key={step} className="flex flex-1 items-center last:flex-none">
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            "grid h-7 w-7 place-items-center rounded-full text-xs font-bold",
                            done ? "bg-accent text-white" : "bg-surface-2 text-muted",
                          )}
                        >
                          {i + 1}
                        </span>
                        <span className={cn("mt-1 text-[11px]", done ? "text-ink" : "text-muted")}>
                          {step.charAt(0) + step.slice(1).toLowerCase()}
                        </span>
                      </div>
                      {i < ORDER_STATUS_FLOW.length - 1 && (
                        <span
                          className={cn(
                            "mx-2 h-0.5 flex-1",
                            i < ORDER_STATUS_FLOW.indexOf(order.status) ? "bg-accent" : "bg-hairline",
                          )}
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          {(order.trackingCarrier || order.trackingNumber || order.trackingUrl) && (
            <div className="rounded-lg border border-hairline bg-surface p-4 text-sm">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold">
                <Truck className="h-4 w-4 text-accent" /> Courier Tracking
              </h3>
              {order.trackingCarrier && (
                <div className="text-muted">Courier: <span className="font-medium text-ink">{order.trackingCarrier}</span></div>
              )}
              {order.trackingNumber && (
                <div className="text-muted">Tracking no: <span className="font-medium text-ink">{order.trackingNumber}</span></div>
              )}
              {order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                >
                  Track your parcel <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
