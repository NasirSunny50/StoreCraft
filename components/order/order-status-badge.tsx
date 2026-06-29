import type { OrderStatus } from "@prisma/client";
import { cn } from "@/lib/utils/cn";

const STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
};

const LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      data-testid="order-status"
      data-status={status}
      className={cn(
        "inline-block rounded px-2 py-0.5 text-xs font-semibold",
        STYLES[status],
      )}
    >
      {LABELS[status]}
    </span>
  );
}
