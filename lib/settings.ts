import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SHIPPING_FEE } from "@/lib/order-math";

/**
 * Admin-configurable store settings, backed by the Setting key-value table.
 * Delivery is charged by destination: an "Inside Dhaka" rate for the Dhaka city,
 * and an "Outside Dhaka" rate for everywhere else. Money values are stored as
 * decimal strings and read back Decimal-safe.
 */

const INSIDE_DHAKA_KEY = "shipping_fee_inside_dhaka";
const OUTSIDE_DHAKA_KEY = "shipping_fee_outside_dhaka";

/** The city value that counts as "inside Dhaka" (matches the address dropdown). */
export const DHAKA_CITY = "Dhaka";

export const DEFAULT_INSIDE_DHAKA_FEE = SHIPPING_FEE; // "60"
export const DEFAULT_OUTSIDE_DHAKA_FEE = "120";

export type DeliveryFees = { insideDhaka: string; outsideDhaka: string };

async function readFee(key: string, fallback: string): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key } });
  if (!row) return fallback;
  try {
    const value = new Prisma.Decimal(row.value);
    if (value.isNegative()) return fallback;
    return value.toString();
  } catch {
    return fallback;
  }
}

/** Current delivery charges, falling back to the built-in defaults when unset. */
export async function getDeliveryFees(): Promise<DeliveryFees> {
  const [insideDhaka, outsideDhaka] = await Promise.all([
    readFee(INSIDE_DHAKA_KEY, DEFAULT_INSIDE_DHAKA_FEE),
    readFee(OUTSIDE_DHAKA_KEY, DEFAULT_OUTSIDE_DHAKA_FEE),
  ]);
  return { insideDhaka, outsideDhaka };
}

/** Persist both delivery charges. Expects validated non-negative decimal strings. */
export async function setDeliveryFees(fees: DeliveryFees): Promise<void> {
  const inside = new Prisma.Decimal(fees.insideDhaka).toString();
  const outside = new Prisma.Decimal(fees.outsideDhaka).toString();
  await prisma.$transaction([
    prisma.setting.upsert({
      where: { key: INSIDE_DHAKA_KEY },
      create: { key: INSIDE_DHAKA_KEY, value: inside },
      update: { value: inside },
    }),
    prisma.setting.upsert({
      where: { key: OUTSIDE_DHAKA_KEY },
      create: { key: OUTSIDE_DHAKA_KEY, value: outside },
      update: { value: outside },
    }),
  ]);
}

/** Delivery charge for a destination city: Inside-Dhaka rate for Dhaka, else Outside. */
export function shippingFeeForCity(city: string, fees: DeliveryFees): string {
  return city.trim() === DHAKA_CITY ? fees.insideDhaka : fees.outsideDhaka;
}

/** Convenience: the current delivery charge for a given city. */
export async function getShippingFeeForCity(city: string): Promise<string> {
  return shippingFeeForCity(city, await getDeliveryFees());
}
