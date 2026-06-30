"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth-guard";

export async function adjustStock(
  productId: string,
  change: number,
  reason: string,
): Promise<{ ok: boolean; error?: string; stock?: number }> {
  const session = await requireStaff(); // STAFF or ADMIN
  const delta = Math.trunc(Number(change));
  if (!Number.isFinite(delta) || delta === 0) {
    return { ok: false, error: "Enter a non-zero whole number." };
  }

  try {
    const stock = await prisma.$transaction(async (tx) => {
      const p = await tx.product.findUnique({
        where: { id: productId },
        select: { stock: true },
      });
      if (!p) throw new Error("Product not found.");
      const next = p.stock + delta;
      if (next < 0) throw new Error("Stock cannot go below zero.");
      await tx.product.update({ where: { id: productId }, data: { stock: next } });
      await tx.stockLog.create({
        data: {
          productId,
          change: delta,
          reason: reason.trim() || "MANUAL_ADJUST",
          changedBy: session.user.id,
        },
      });
      return next;
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/products");
    revalidatePath("/", "layout");
    return { ok: true, stock };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to adjust stock." };
  }
}
