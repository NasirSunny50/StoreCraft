import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  getDeliveryFees,
  setDeliveryFees,
  shippingFeeForCity,
  DEFAULT_INSIDE_DHAKA_FEE,
  DEFAULT_OUTSIDE_DHAKA_FEE,
} from "@/lib/settings";
import { createOrderForUser } from "@/lib/orders";

const KEYS = ["shipping_fee_inside_dhaka", "shipping_fee_outside_dhaka"];
const TAG = `set_${Date.now()}`;

describe("store settings — delivery charges", () => {
  afterAll(async () => {
    // Restore defaults so other suites see the built-in fees.
    await prisma.setting.deleteMany({ where: { key: { in: KEYS } } });
    await prisma.$disconnect();
  });

  it("falls back to the defaults when unset", async () => {
    await prisma.setting.deleteMany({ where: { key: { in: KEYS } } });
    expect(await getDeliveryFees()).toEqual({
      insideDhaka: DEFAULT_INSIDE_DHAKA_FEE,
      outsideDhaka: DEFAULT_OUTSIDE_DHAKA_FEE,
    });
  });

  it("persists and reads back admin-set values (decimal-safe)", async () => {
    await setDeliveryFees({ insideDhaka: "70", outsideDhaka: "130.50" });
    expect(await getDeliveryFees()).toEqual({ insideDhaka: "70", outsideDhaka: "130.5" });
  });

  it("picks Inside-Dhaka rate for Dhaka, Outside for anywhere else", () => {
    const fees = { insideDhaka: "60", outsideDhaka: "120" };
    expect(shippingFeeForCity("Dhaka", fees)).toBe("60");
    expect(shippingFeeForCity(" Dhaka ", fees)).toBe("60"); // trimmed
    expect(shippingFeeForCity("Sylhet", fees)).toBe("120");
    expect(shippingFeeForCity("Chattogram", fees)).toBe("120");
  });

  it("a new order is charged by its destination city (snapshotted)", async () => {
    const cat = await prisma.category.create({ data: { name: `Cat ${TAG}`, slug: `cat-${TAG}` } });
    const product = await prisma.product.create({
      data: { name: `P ${TAG}`, slug: `p-${TAG}`, description: "d", price: "1000.00", stock: 20, categoryId: cat.id },
    });
    const user = await prisma.user.create({
      data: { name: "Fee Tester", email: `${TAG}@test.local`, password: "x", role: "CUSTOMER" },
    });
    const dhaka = await prisma.address.create({
      data: { userId: user.id, fullName: "F", phone: "0171", line1: "L1", city: "Dhaka", isDefault: true },
    });
    const outside = await prisma.address.create({
      data: { userId: user.id, fullName: "F", phone: "0171", line1: "L2", city: "Sylhet" },
    });
    const cart = await prisma.cart.create({ data: { userId: user.id } });
    async function setCart() {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      await prisma.cartItem.create({ data: { cartId: cart.id, productId: product.id, quantity: 1 } });
    }

    await setDeliveryFees({ insideDhaka: "60", outsideDhaka: "150" });

    await setCart();
    const inDhaka = await createOrderForUser(user.id, { addressId: dhaka.id });
    const o1 = await prisma.order.findUnique({ where: { id: inDhaka.id } });
    expect(o1?.shippingFee.toFixed(2)).toBe("60.00");
    expect(o1?.total.toFixed(2)).toBe("1060.00");

    await setCart();
    const outDhaka = await createOrderForUser(user.id, { addressId: outside.id });
    const o2 = await prisma.order.findUnique({ where: { id: outDhaka.id } });
    expect(o2?.shippingFee.toFixed(2)).toBe("150.00");
    expect(o2?.total.toFixed(2)).toBe("1150.00");

    // Cleanup
    await prisma.order.deleteMany({ where: { userId: user.id } });
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.deleteMany({ where: { id: cart.id } });
    await prisma.address.deleteMany({ where: { userId: user.id } });
    await prisma.product.deleteMany({ where: { categoryId: cat.id } });
    await prisma.category.deleteMany({ where: { id: cat.id } });
    await prisma.user.deleteMany({ where: { id: user.id } });
  });
});
