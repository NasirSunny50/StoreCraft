import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { createOrderForUser, cancelOrder, CheckoutError } from "@/lib/orders";

const TAG = `cot_${Date.now()}`;
let userId = "";
let productId = "";
let categoryId = "";
let addressId = "";
let cartId = "";

async function setCartQty(qty: number) {
  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    update: { quantity: qty },
    create: { cartId, productId, quantity: qty },
  });
}

beforeAll(async () => {
  const category = await prisma.category.create({
    data: { name: `Cat ${TAG}`, slug: `cat-${TAG}` },
  });
  categoryId = category.id;

  const product = await prisma.product.create({
    data: {
      name: `Test Product ${TAG}`,
      slug: `prod-${TAG}`,
      description: "integration test product",
      price: "1000.00",
      stock: 5,
      categoryId,
    },
  });
  productId = product.id;

  const user = await prisma.user.create({
    data: {
      name: "Checkout Tester",
      email: `${TAG}@test.local`,
      password: "x",
      role: "CUSTOMER",
    },
  });
  userId = user.id;

  const address = await prisma.address.create({
    data: {
      userId,
      fullName: "Checkout Tester",
      phone: "0171000000",
      line1: "Road 1",
      city: "Dhaka",
      isDefault: true,
    },
  });
  addressId = address.id;

  const cart = await prisma.cart.create({ data: { userId } });
  cartId = cart.id;
});

afterAll(async () => {
  await prisma.order.deleteMany({ where: { userId } });
  await prisma.stockLog.deleteMany({ where: { productId } });
  await prisma.cartItem.deleteMany({ where: { cartId } });
  await prisma.cart.deleteMany({ where: { id: cartId } });
  await prisma.address.deleteMany({ where: { userId } });
  await prisma.product.deleteMany({ where: { id: productId } });
  await prisma.category.deleteMany({ where: { id: categoryId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("createOrderForUser", () => {
  it("places an order, decrements stock, snapshots items, clears cart", async () => {
    await setCartQty(2);
    const order = await createOrderForUser(userId, { addressId });

    expect(order.orderNumber).toMatch(/^ORD-\d{4}-\d{6}$/);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product?.stock).toBe(3); // 5 − 2

    const dbOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true, statusLogs: true },
    });
    expect(dbOrder?.status).toBe("PENDING");
    expect(dbOrder?.total.toFixed(2)).toBe("2060.00"); // 2*1000 + 60 shipping
    expect(dbOrder?.items).toHaveLength(1);
    expect(dbOrder?.items[0]?.name).toContain("Test Product");
    expect(dbOrder?.items[0]?.price.toFixed(2)).toBe("1000.00");
    expect(dbOrder?.statusLogs[0]?.status).toBe("PENDING");

    const cartItems = await prisma.cartItem.count({ where: { cartId } });
    expect(cartItems).toBe(0);

    const saleLog = await prisma.stockLog.findFirst({
      where: { productId, reason: "SALE" },
    });
    expect(saleLog?.change).toBe(-2);
  });

  it("blocks oversell and leaves stock untouched", async () => {
    const before = (await prisma.product.findUnique({ where: { id: productId } }))!.stock;
    expect(before).toBe(3);

    await setCartQty(10); // more than the 3 in stock
    await expect(createOrderForUser(userId, { addressId })).rejects.toBeInstanceOf(
      CheckoutError,
    );

    const after = (await prisma.product.findUnique({ where: { id: productId } }))!.stock;
    expect(after).toBe(3); // unchanged — transaction rolled back
    await prisma.cartItem.deleteMany({ where: { cartId } });
  });

  it("rejects an empty cart", async () => {
    await prisma.cartItem.deleteMany({ where: { cartId } });
    await expect(createOrderForUser(userId, { addressId })).rejects.toBeInstanceOf(
      CheckoutError,
    );
  });

  it("generates sequential, unique order numbers", async () => {
    await setCartQty(1);
    const a = await createOrderForUser(userId, { addressId });
    await setCartQty(1);
    const b = await createOrderForUser(userId, { addressId });
    expect(a.orderNumber).not.toBe(b.orderNumber);
  });
});

describe("cancelOrder", () => {
  it("restocks items and marks the order CANCELLED", async () => {
    await prisma.product.update({ where: { id: productId }, data: { stock: 5 } });
    await setCartQty(2);
    const order = await createOrderForUser(userId, { addressId });
    const afterPlace = (await prisma.product.findUnique({ where: { id: productId } }))!.stock;

    await cancelOrder(userId, order.id);

    const afterCancel = (await prisma.product.findUnique({ where: { id: productId } }))!.stock;
    expect(afterCancel).toBe(afterPlace + 2);

    const dbOrder = await prisma.order.findUnique({ where: { id: order.id } });
    expect(dbOrder?.status).toBe("CANCELLED");
  });

  it("refuses to cancel a non-pending order", async () => {
    await setCartQty(1);
    const order = await createOrderForUser(userId, { addressId });
    await prisma.order.update({ where: { id: order.id }, data: { status: "SHIPPED" } });
    await expect(cancelOrder(userId, order.id)).rejects.toBeInstanceOf(CheckoutError);
  });
});
