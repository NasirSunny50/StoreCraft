"use server";

import type { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth-guard";

const VALID: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

/** Admin/staff update an order's status (logged). Cancelling restocks items. */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  note?: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireStaff();
  if (!VALID.includes(status)) return { ok: false, error: "Invalid status." };

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!order) throw new Error("Order not found.");
      if (order.status === status) throw new Error("Order already has that status.");

      // Restock when moving INTO cancelled from a non-cancelled state.
      if (status === "CANCELLED" && order.status !== "CANCELLED") {
        for (const item of order.items) {
          await tx.product.updateMany({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        await tx.stockLog.createMany({
          data: order.items.map((i) => ({
            productId: i.productId,
            change: i.quantity,
            reason: "CANCEL",
            changedBy: session.user.id,
          })),
        });
      }

      await tx.order.update({ where: { id: orderId }, data: { status } });
      await tx.orderStatusLog.create({
        data: {
          orderId,
          status,
          note: note?.trim() || null,
          changedBy: session.user.id,
        },
      });
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/orders");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update status." };
  }
}
