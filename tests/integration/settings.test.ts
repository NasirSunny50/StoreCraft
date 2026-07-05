import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { getShippingFee, setShippingFee } from "@/lib/settings";
import { SHIPPING_FEE } from "@/lib/order-math";
import { createOrderForUser } from "@/lib/orders";

const KEY = "shipping_fee";
const TAG = `set_${Date.now()}`;
async function put(value: string) {
  await prisma.setting.upsert({
    where: { key: KEY },
    create: { key: KEY, value },
    update: { value },
  });
}

describe("store settings — delivery charge", () => {
  afterAll(async () => {
    // Restore the default so other suites (pricing) see the built-in fee.
    await prisma.setting.deleteMany({ where: { key: KEY } });
    await prisma.$disconnect();
  });

  it("falls back to the default when unset", async () => {
    await prisma.setting.deleteMany({ where: { key: KEY } });
    expect(await getShippingFee()).toBe(SHIPPING_FEE);
  });

  it("persists and reads back an admin-set value (decimal-safe)", async () => {
    await setShippingFee("80");
    expect(await getShippingFee()).toBe("80");
    await setShippingFee("120.50");
    expect(await getShippingFee()).toBe("120.5");
  });

  it("ignores a malformed or negative stored value", async () => {
    await put("-5");
    expect(await getShippingFee()).toBe(SHIPPING_FEE);
    await put("not-a-number");
    expect(await getShippingFee()).toBe(SHIPPING_FEE);
  });

  it("a new order uses the admin-set delivery charge (snapshotted)", async () => {
    const cat = await prisma.category.create({ data: { name: `Cat ${TAG}`, slug: `cat-${TAG}` } });
    const product = await prisma.product.create({
      data: { name: `P ${TAG}`, slug: `p-${TAG}`, description: "d", price: "1000.00", stock: 10, categoryId: cat.id },
    });
    const user = await prisma.user.create({
      data: { name: "Fee Tester", email: `${TAG}@test.local`, password: "x", role: "CUSTOMER" },
    });
    const address = await prisma.address.create({
      data: { userId: user.id, fullName: "F", phone: "0171", line1: "L1", city: "Dhaka", isDefault: true },
    });
    const cart = await prisma.cart.create({ data: { userId: user.id } });
    await prisma.cartItem.create({ data: { cartId: cart.id, productId: product.id, quantity: 1 } });

    await setShippingFee("150");
    const placed = await createOrderForUser(user.id, { addressId: address.id });
    const order = await prisma.order.findUnique({ where: { id: placed.id } });
    expect(order?.shippingFee.toFixed(2)).toBe("150.00");
    expect(order?.total.toFixed(2)).toBe("1150.00"); // 1000 + 150

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
