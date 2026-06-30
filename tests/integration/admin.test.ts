import { vi, describe, it, expect, beforeAll, afterAll } from "vitest";

// Make guarded admin actions callable outside a request: fake an ADMIN session
// and no-op cache revalidation.
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => ({ user: { id: "test-admin", role: "ADMIN" } })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { createProduct, softDeleteProduct, bulkUploadProducts } from "@/lib/actions/admin-product";
import { adjustStock } from "@/lib/actions/admin-inventory";
import { updateOrderStatus } from "@/lib/actions/admin-order";
import { createCoupon } from "@/lib/actions/admin-coupon";
import { setUserBlocked } from "@/lib/actions/admin-customer";
import { createOrderForUser, CheckoutError } from "@/lib/orders";
import { getProducts } from "@/lib/queries/product";

const TAG = `adm_${Date.now()}`;
const SUF = TAG.slice(-5);
let categoryName = "";
let categoryId = "";
let customerId = "";
let addressId = "";
let cartId = "";
let cprodId = "";

const baseProduct = {
  description: "integration product",
  lowStockAt: 5,
  isActive: true,
  isFeatured: false,
  specs: [] as { key: string; value: string }[],
  images: [] as string[],
};

beforeAll(async () => {
  categoryName = `Cat ${TAG}`;
  const cat = await prisma.category.create({ data: { name: categoryName, slug: `cat-${TAG}` } });
  categoryId = cat.id;
  const user = await prisma.user.create({
    data: { name: "Admin Test Customer", email: `${TAG}@test.local`, password: "x", role: "CUSTOMER" },
  });
  customerId = user.id;
  const addr = await prisma.address.create({
    data: { userId: customerId, fullName: "C", phone: "0171", line1: "L1", city: "Dhaka", isDefault: true },
  });
  addressId = addr.id;
  const cart = await prisma.cart.create({ data: { userId: customerId } });
  cartId = cart.id;

  const cprod = await prisma.product.create({
    data: { name: `Cprod ${TAG}`, slug: `cprod-${TAG}`, description: "d", price: "1000", stock: 20, categoryId },
  });
  cprodId = cprod.id;
});

afterAll(async () => {
  await prisma.order.deleteMany({ where: { userId: customerId } });
  await prisma.coupon.deleteMany({ where: { code: { contains: SUF } } });
  await prisma.cartItem.deleteMany({ where: { cartId } });
  await prisma.cart.deleteMany({ where: { id: cartId } });
  await prisma.address.deleteMany({ where: { userId: customerId } });
  await prisma.product.deleteMany({ where: { categoryId } });
  await prisma.category.deleteMany({ where: { id: categoryId } });
  await prisma.user.deleteMany({ where: { id: customerId } });
  await prisma.$disconnect();
});

describe("product management", () => {
  it("creates a product, lists it in storefront, then soft-delete hides it", async () => {
    const res = await createProduct({ ...baseProduct, name: `Widget ${TAG}`, price: 1500, stock: 4, categoryId, specs: [{ key: "K", value: "V" }] });
    expect(res.ok).toBe(true);
    const id = res.ok ? res.id : "";

    let page = await getProducts({ sort: "newest", inStock: false }, 300);
    expect(page.items.some((p) => p.id === id)).toBe(true);

    const log = await prisma.stockLog.findFirst({ where: { productId: id, reason: "INITIAL" } });
    expect(log?.change).toBe(4);

    await softDeleteProduct(id);
    page = await getProducts({ sort: "newest", inStock: false }, 300);
    expect(page.items.some((p) => p.id === id)).toBe(false);
    const p = await prisma.product.findUnique({ where: { id } });
    expect(p?.isDeleted).toBe(true);
  });

  it("rejects a product with price <= 0", async () => {
    const res = await createProduct({ ...baseProduct, name: "Bad Price", price: 0, stock: 1, categoryId });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.price).toBeDefined();
  });

  it("bulk import creates valid rows and reports bad ones", async () => {
    const csv = `name,description,price,stock,category,brand,comparePrice
CSV Good ${TAG},desc,1200,5,${categoryName},,
CSV Bad ${TAG},desc,1300,5,NoSuchCategory ${TAG},,`;
    const res = await bulkUploadProducts(csv);
    expect(res.created).toBe(1);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0]?.message).toMatch(/Unknown category/);
  });
});

describe("inventory", () => {
  it("adjusts stock and logs it; blocks going below zero", async () => {
    const before = (await prisma.product.findUnique({ where: { id: cprodId } }))!.stock;
    const r1 = await adjustStock(cprodId, 5, "RESTOCK");
    expect(r1.ok).toBe(true);
    expect(r1.stock).toBe(before + 5);

    const r2 = await adjustStock(cprodId, -100000, "BAD");
    expect(r2.ok).toBe(false);
    const after = (await prisma.product.findUnique({ where: { id: cprodId } }))!.stock;
    expect(after).toBe(before + 5);

    const log = await prisma.stockLog.findFirst({ where: { productId: cprodId, reason: "RESTOCK" } });
    expect(log?.change).toBe(5);
  });
});

describe("coupons at checkout", () => {
  it("applies a percent coupon: discount, total, usedCount", async () => {
    await prisma.cartItem.deleteMany({ where: { cartId } });
    await prisma.cartItem.create({ data: { cartId, productId: cprodId, quantity: 2 } }); // subtotal 2000
    const code = `PCT${SUF}`;
    const cres = await createCoupon({ code, type: "PERCENT", value: 10, minOrder: 0, isActive: true });
    expect(cres.ok).toBe(true);

    const order = await createOrderForUser(customerId, { addressId, couponCode: code.toLowerCase() });
    const db = await prisma.order.findUnique({ where: { id: order.id } });
    expect(db?.discount.toFixed(2)).toBe("200.00");
    expect(db?.total.toFixed(2)).toBe("1860.00"); // 2000 + 60 − 200

    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    expect(coupon?.usedCount).toBe(1);
  });

  it("rejects an expired coupon", async () => {
    await prisma.cartItem.create({ data: { cartId, productId: cprodId, quantity: 1 } });
    const code = `EXP${SUF}`;
    await prisma.coupon.create({ data: { code, type: "FIXED", value: 100, expiresAt: new Date("2020-01-01") } });
    await expect(createOrderForUser(customerId, { addressId, couponCode: code })).rejects.toBeInstanceOf(CheckoutError);
    await prisma.cartItem.deleteMany({ where: { cartId } });
  });
});

describe("order status management", () => {
  it("updates status with a log and restocks on cancel", async () => {
    await prisma.cartItem.deleteMany({ where: { cartId } });
    await prisma.cartItem.create({ data: { cartId, productId: cprodId, quantity: 1 } });
    const order = await createOrderForUser(customerId, { addressId });
    const afterPlace = (await prisma.product.findUnique({ where: { id: cprodId } }))!.stock;

    const c = await updateOrderStatus(order.id, "CONFIRMED", "verified");
    expect(c.ok).toBe(true);
    let db = await prisma.order.findUnique({ where: { id: order.id }, include: { statusLogs: true } });
    expect(db?.status).toBe("CONFIRMED");
    expect(db?.statusLogs.some((l) => l.status === "CONFIRMED" && l.note === "verified")).toBe(true);

    await updateOrderStatus(order.id, "CANCELLED", "refund issued");
    const afterCancel = (await prisma.product.findUnique({ where: { id: cprodId } }))!.stock;
    expect(afterCancel).toBe(afterPlace + 1);
    db = await prisma.order.findUnique({ where: { id: order.id } });
    expect(db?.status).toBe("CANCELLED");
  });
});

describe("customer management", () => {
  it("blocks a customer", async () => {
    const r = await setUserBlocked(customerId, true);
    expect(r.ok).toBe(true);
    const u = await prisma.user.findUnique({ where: { id: customerId } });
    expect(u?.isBlocked).toBe(true);
  });
});
