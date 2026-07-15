"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth-guard";

/**
 * Adjust a product's stock. On a positive restock with a `unitCost`, the
 * product's cost price is updated as a moving weighted-average (so buying at
 * different prices over time stays accurate) and the batch cost is logged.
 */
export async function adjustStock(
  productId: string,
  change: number,
  reason: string,
  unitCost?: number,
): Promise<{ ok: boolean; error?: string; stock?: number }> {
  const session = await requireStaff(); // STAFF or ADMIN
  const delta = Math.trunc(Number(change));
  if (!Number.isFinite(delta) || delta === 0) {
    return { ok: false, error: "Enter a non-zero whole number." };
  }

  const cost = unitCost == null ? null : Number(unitCost);
  if (cost != null && (!Number.isFinite(cost) || cost < 0)) {
    return { ok: false, error: "Enter a valid unit cost." };
  }
  // A unit cost only feeds the weighted-average on an actual restock (add stock).
  const applyCost = cost != null && delta > 0;

  try {
    const stock = await prisma.$transaction(async (tx) => {
      const p = await tx.product.findUnique({
        where: { id: productId },
        select: { stock: true, costPrice: true },
      });
      if (!p) throw new Error("Product not found.");
      const next = p.stock + delta;
      if (next < 0) throw new Error("Stock cannot go below zero.");

      const data: Prisma.ProductUpdateInput = { stock: next };
      let newAvg: Prisma.Decimal | null = null;
      if (applyCost) {
        // Weighted-average: (oldQty·oldCost + newQty·newCost) / (oldQty + newQty).
        const oldQty = Math.max(p.stock, 0);
        const denom = oldQty + delta;
        newAvg =
          denom > 0
            ? new Prisma.Decimal(oldQty)
                .times(p.costPrice)
                .plus(new Prisma.Decimal(delta).times(cost!))
                .div(denom)
                .toDecimalPlaces(2)
            : new Prisma.Decimal(cost!);
        data.costPrice = newAvg;
      }

      await tx.product.update({ where: { id: productId }, data });
      await tx.stockLog.create({
        data: {
          productId,
          change: delta,
          reason: reason.trim() || (delta > 0 ? "RESTOCK" : "MANUAL_ADJUST"),
          unitCost: applyCost ? new Prisma.Decimal(cost!) : null,
          costAfter: newAvg, // resulting average cost (cost-history trail)
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
