import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { createOrderForUser, CheckoutError } from "@/lib/orders";

// Pricing / checkout loophole probes. These verify that a customer cannot
// influence the price they pay, and that coupons can never produce a negative
// or below-shipping total.
const TAG = `price_${Date.now()}`;
const SUF = TAG.slice(-6);
let categoryId = "";
let userId = "";
let addressId = "";
let cartId = "";
let productId = "";

async function setCart(qty: number) {
  await prisma.cartItem.deleteMany({ where: { cartId } });
  if (qty > 0) {
    await prisma.cartItem.create({ data: { cartId, productId, quantity: qty } });
  }
}

beforeAll(async () => {
  const cat = await prisma.category.create({ data: { name: `Cat ${TAG}`, slug: `cat-${TAG}` } });
  categoryId = cat.id;
  const product = await prisma.product.create({
    data: { name: `Price Probe ${TAG}`, slug: `pp-${TAG}`, description: "d", price: "1000.00", stock: 100, categoryId },
  });
  productId = product.id;
  const user = await prisma.user.create({
    data: { name: "Price Tester", email: `${TAG}@test.local`, password: "x", role: "CUSTOMER" },
  });
  userId = user.id;
  const addr = await prisma.address.create({
    data: { userId, fullName: "P", phone: "0171", line1: "L1", city: "Dhaka", isDefault: true },
  });
  addressId = addr.id;
  const cart = await prisma.cart.create({ data: { userId } });
  cartId = cart.id;
});

afterAll(async () => {
  await prisma.order.deleteMany({ where: { userId } });
  await prisma.coupon.deleteMany({ where: { code: { contains: SUF } } });
  await prisma.cartItem.deleteMany({ where: { cartId } });
  await prisma.cart.deleteMany({ where: { id: cartId } });
  await prisma.address.deleteMany({ where: { userId } });
  await prisma.product.deleteMany({ where: { categoryId } });
  await prisma.category.deleteMany({ where: { id: categoryId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

describe("price integrity", () => {
  it("charges the CURRENT product price at checkout, not a stale cart price", async () => {
    await prisma.product.update({ where: { id: productId }, data: { price: "1000.00" } });
    await setCart(2);
    // Admin changes the price AFTER the item is in the cart.
    await prisma.product.update({ where: { id: productId }, data: { price: "1500.00" } });

    const order = await createOrderForUser(userId, { addressId });
    const db = await prisma.order.findUnique({ where: { id: order.id }, include: { items: true } });
    expect(db?.items[0]?.price.toFixed(2)).toBe("1500.00"); // snapshot of current price
    expect(db?.subtotal.toFixed(2)).toBe("3000.00");
    expect(db?.total.toFixed(2)).toBe("3060.00"); // 3000 + 60 shipping
  });

  it("total always equals subtotal + shipping − discount", async () => {
    await setCart(3); // 3 × 1500 = 4500
    const order = await createOrderForUser(userId, { addressId });
    const db = await prisma.order.findUnique({ where: { id: order.id } });
    const expected = db!.subtotal.plus(db!.shippingFee).minus(db!.discount);
    expect(db!.total.equals(expected)).toBe(true);
    expect(db!.total.toFixed(2)).toBe("4560.00");
  });
});

describe("coupon loopholes", () => {
  it("a huge fixed coupon cannot discount below the shipping fee", async () => {
    await setCart(1); // subtotal 1500
    const code = `HUGE${SUF}`;
    await prisma.coupon.create({ data: { code, type: "FIXED", value: "999999" } });

    const order = await createOrderForUser(userId, { addressId, couponCode: code });
    const db = await prisma.order.findUnique({ where: { id: order.id } });
    expect(db?.discount.toFixed(2)).toBe("1500.00"); // capped at subtotal
    expect(db?.total.toFixed(2)).toBe("60.00"); // never below shipping, never negative
    expect(db!.total.isNegative()).toBe(false);
  });

  it("a percent coupon discounts exactly and total stays correct", async () => {
    await setCart(2); // subtotal 3000
    const code = `PCT${SUF}`;
    await prisma.coupon.create({ data: { code, type: "PERCENT", value: "25" } });
    const order = await createOrderForUser(userId, { addressId, couponCode: code });
    const db = await prisma.order.findUnique({ where: { id: order.id } });
    expect(db?.discount.toFixed(2)).toBe("750.00"); // 25% of 3000
    expect(db?.total.toFixed(2)).toBe("2310.00"); // 3000 − 750 + 60
  });

  it("enforces coupon usage limit across orders", async () => {
    const code = `ONCE${SUF}`;
    await prisma.coupon.create({ data: { code, type: "PERCENT", value: "10", usageLimit: 1 } });

    await setCart(1);
    await createOrderForUser(userId, { addressId, couponCode: code }); // uses the 1 allowed
    const after = await prisma.coupon.findUnique({ where: { code } });
    expect(after?.usedCount).toBe(1);

    await setCart(1);
    await expect(createOrderForUser(userId, { addressId, couponCode: code })).rejects.toBeInstanceOf(CheckoutError);
  });

  it("rejects a coupon whose minimum order is not met", async () => {
    const code = `MIN${SUF}`;
    await prisma.coupon.create({ data: { code, type: "FIXED", value: "100", minOrder: "999999" } });
    await setCart(1);
    await expect(createOrderForUser(userId, { addressId, couponCode: code })).rejects.toBeInstanceOf(CheckoutError);
  });
});

describe("account state", () => {
  it("a blocked customer cannot place an order (even mid-session)", async () => {
    await setCart(1);
    await prisma.user.update({ where: { id: userId }, data: { isBlocked: true } });
    await expect(createOrderForUser(userId, { addressId })).rejects.toBeInstanceOf(CheckoutError);
    await prisma.user.update({ where: { id: userId }, data: { isBlocked: false } });
  });
});
