import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth-guard";
import { getOrderByNumberForUser } from "@/lib/queries/order";
import { canCancelOrder, ORDER_STATUS_FLOW, paymentMethodLabel } from "@/lib/order-math";
import { formatBDT } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { CancelOrderButton } from "@/components/order/cancel-order-button";
import { RetryPaymentButton } from "@/components/order/retry-payment-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  return { title: `${orderNumber} — StoreCraft` };
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ placed?: string; payment?: string }>;
}) {
  const session = await requireAuth();
  const { orderNumber } = await params;
  const { placed, payment } = await searchParams;
  const order = await getOrderByNumberForUser(session.user.id, orderNumber);
  if (!order) notFound();

  const cancelled = order.status === "CANCELLED";
  const currentStep = ORDER_STATUS_FLOW.indexOf(order.status);
  const addr = order.address;
  // Unpaid online order (e.g. after a failed/cancelled attempt) — let the
  // customer re-open the gateway instead of rebuilding their (now-cleared) cart.
  const canRetryPayment =
    order.paymentMethod === "SSLCOMMERZ" &&
    order.paymentStatus === "UNPAID" &&
    order.status !== "CANCELLED";

  return (
    <div className="space-y-4">
      {placed === "1" && (
        <div
          data-testid="order-confirmation"
          className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          <CheckCircle2 className="h-5 w-5" />
          <span>
            Thank you! Your order <strong>{order.orderNumber}</strong> has been
            placed. We&apos;ll contact you to confirm delivery.
          </span>
        </div>
      )}

      {(payment === "failed" || payment === "cancelled" || payment === "error") && (
        <div
          data-testid="payment-notice"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          {payment === "cancelled"
            ? "Payment was cancelled. Your order is saved as unpaid — use “Pay now” to complete payment, or cancel the order."
            : payment === "failed"
              ? "Payment failed. Your order is saved as unpaid — use “Pay now” to try again, or cancel the order."
              : "We couldn't confirm your payment. If money was deducted, it will be refunded; please contact support."}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/orders"
            className="flex items-center gap-1 rounded-full border border-hairline-strong px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Orders
          </Link>
          <h1 data-testid="order-number" className="text-xl font-bold text-ink md:text-2xl">
            {order.orderNumber}
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>
        {(canRetryPayment || canCancelOrder(order.status)) && (
          <div className="flex items-start gap-2">
            {canRetryPayment && <RetryPaymentButton orderId={order.id} />}
            {canCancelOrder(order.status) && <CancelOrderButton orderId={order.id} />}
          </div>
        )}
      </div>

      {/* Status timeline */}
      <div className="rounded-lg border border-hairline bg-surface p-4">
        {cancelled ? (
          <p className="text-sm font-medium text-accent">This order was cancelled.</p>
        ) : (
          <ol className="flex items-center" data-testid="status-timeline">
            {ORDER_STATUS_FLOW.map((step, i) => {
              const done = i <= currentStep;
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
                        i < currentStep ? "bg-accent" : "bg-hairline",
                      )}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Items */}
        <div className="rounded-lg border border-hairline bg-surface">
          <div className="border-b border-hairline px-4 py-3">
            <h2 className="text-sm font-bold">Items</h2>
          </div>
          <div className="divide-y divide-hairline">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <div className="font-medium text-ink">{item.name}</div>
                  <div className="text-muted">
                    {formatBDT(item.price)} × {item.quantity}
                    {item.color ? ` · ${item.color}` : ""}
                  </div>
                </div>
                <div className="font-medium">
                  {formatBDT(item.price.times(item.quantity))}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-1.5 border-t border-hairline px-4 py-3 text-sm">
            <Row label="Subtotal" value={formatBDT(order.subtotal)} />
            <Row label="Shipping" value={formatBDT(order.shippingFee)} />
            {order.discount.greaterThan(0) && (
              <Row label="Discount" value={`− ${formatBDT(order.discount)}`} />
            )}
            <div className="flex justify-between border-t border-hairline pt-2 text-base font-bold">
              <span>Total</span>
              <span data-testid="order-total" className="text-accent">
                {formatBDT(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Address + meta */}
        <aside className="space-y-4">
          <div className="rounded-lg border border-hairline bg-surface p-4 text-sm">
            <h2 className="mb-2 text-sm font-bold">Delivery Address</h2>
            <div className="font-medium text-ink">{addr.fullName}</div>
            <div className="text-muted">{addr.phone}</div>
            <div className="text-muted">
              {[addr.line1, addr.line2, addr.area, addr.city, addr.postcode]
                .filter(Boolean)
                .join(", ")}
            </div>
          </div>
          <div className="rounded-lg border border-hairline bg-surface p-4 text-sm">
            <h2 className="mb-2 text-sm font-bold">Payment</h2>
            <div className="text-muted">{paymentMethodLabel(order.paymentMethod)} · {order.paymentStatus}</div>
            {order.note && (
              <p className="mt-2 text-muted">
                <span className="font-medium text-ink">Note:</span> {order.note}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span>{value}</span>
    </div>
  );
}
