import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SHIPPING_FEE } from "@/lib/order-math";

/**
 * Admin-configurable store settings, backed by the Setting key-value table.
 * Money values are stored as decimal strings and read back Decimal-safe.
 */

const SHIPPING_FEE_KEY = "shipping_fee";

/**
 * Current delivery charge (BDT) as a decimal string. Falls back to the built-in
 * default when unset or if a stored value is somehow malformed/negative.
 */
export async function getShippingFee(): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key: SHIPPING_FEE_KEY } });
  if (!row) return SHIPPING_FEE;
  try {
    const value = new Prisma.Decimal(row.value);
    if (value.isNegative()) return SHIPPING_FEE;
    return value.toString();
  } catch {
    return SHIPPING_FEE;
  }
}

/** Persist the delivery charge. Expects a validated non-negative decimal string. */
export async function setShippingFee(value: string): Promise<void> {
  const normalized = new Prisma.Decimal(value).toString();
  await prisma.setting.upsert({
    where: { key: SHIPPING_FEE_KEY },
    create: { key: SHIPPING_FEE_KEY, value: normalized },
    update: { value: normalized },
  });
}
