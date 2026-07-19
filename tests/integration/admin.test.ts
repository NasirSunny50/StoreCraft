import { vi, describe, it, expect, beforeAll, afterAll } from "vitest";

// Make guarded admin actions callable outside a request: fake an ADMIN session
// and no-op cache revalidation.
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => ({ user: { id: "test-admin", role: "ADMIN" } })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { prisma } from "@/lib/prisma";
import { createProduct, softDeleteProduct, restoreProduct, setProductActive, bulkUploadProducts } from "@/lib/actions/admin-product";
import { getAdminProducts, getDeletedProductCount } from "@/lib/queries/admin-product";
import { adjustStock } from "@/lib/actions/admin-inventory";
import { updateOrderStatus } from "@/lib/actions/admin-order";
import { createCoupon } from "@/lib/actions/admin-coupon";
import { setUserBlocked } from "@/lib/actions/admin-customer";
import { createOrderForUser, markOrderPaid, CheckoutError } from "@/lib/orders";
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
  colors: [] as string[],
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
    const csv = `Name,Description,Regular Price,Sale Price,Cost Price,Stock,Category,Brand
CSV Good ${TAG},desc,1200,,800,5,${categoryName},
CSV Sale ${TAG},desc,2000,1500,900,3,${categoryName},
CSV Bad ${TAG},desc,1300,,,5,NoSuchCategory ${TAG},`;
    const res = await bulkUploadProducts(csv);
    expect(res.created).toBe(2);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0]?.message).toMatch(/Unknown category/);

    // No sale → charge Regular Price, no struck price; Cost Price stored.
    const good = await prisma.product.findFirst({ where: { name: `CSV Good ${TAG}` } });
    expect(Number(good?.price)).toBe(1200);
    expect(good?.comparePrice).toBeNull();
    expect(Number(good?.costPrice)).toBe(800);

    // On sale → charge Sale Price, keep Regular Price as the struck compare price.
    const sale = await prisma.product.findFirst({ where: { name: `CSV Sale ${TAG}` } });
    expect(Number(sale?.price)).toBe(1500);
    expect(Number(sale?.comparePrice)).toBe(2000);
    expect(Number(sale?.costPrice)).toBe(900);
  });

  it("toggles a product's active state from the list", async () => {
    const res = await createProduct({ ...baseProduct, name: `Toggle ${TAG}`, price: 500, stock: 1, categoryId });
    const id = res.ok ? res.id : "";
    await setProductActive(id, false);
    expect((await prisma.product.findUnique({ where: { id } }))?.isActive).toBe(false);
    await setProductActive(id, true);
    expect((await prisma.product.findUnique({ where: { id } }))?.isActive).toBe(true);
  });

  it("separates active and deleted views and counts deleted", async () => {
    const res = await createProduct({ ...baseProduct, name: `View ${TAG}`, price: 500, stock: 1, categoryId });
    const id = res.ok ? res.id : "";
    const q = `View ${TAG}`;

    expect((await getAdminProducts({ q, view: "active" })).items.some((p) => p.id === id)).toBe(true);
    expect((await getAdminProducts({ q, view: "deleted" })).items.some((p) => p.id === id)).toBe(false);

    const before = await getDeletedProductCount();
    await softDeleteProduct(id);
    expect(await getDeletedProductCount()).toBe(before + 1);

    expect((await getAdminProducts({ q, view: "active" })).items.some((p) => p.id === id)).toBe(false);
    expect((await getAdminProducts({ q, view: "deleted" })).items.some((p) => p.id === id)).toBe(true);

    // Restore returns it to the active view.
    await restoreProduct(id);
    expect((await getAdminProducts({ q, view: "active" })).items.some((p) => p.id === id)).toBe(true);
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
    const db = await prisma.order.findUnique({ where: { id: order.id }, include: { statusLogs: true } });
    expect(db?.status).toBe("CONFIRMED");
    expect(db?.statusLogs.some((l) => l.status === "CONFIRMED" && l.note === "verified")).toBe(true);

    await updateOrderStatus(order.id, "CANCELLED", "refund issued");
    const afterCancel = (await prisma.product.findUnique({ where: { id: cprodId } }))!.stock;
    expect(afterCancel).toBe(afterPlace + 1);
    const cancelled = await prisma.order.findUnique({ where: { id: order.id } });
    expect(cancelled?.status).toBe("CANCELLED");
  });

  it("auto-confirms a PENDING order when online payment is marked paid", async () => {
    await prisma.cartItem.deleteMany({ where: { cartId } });
    await prisma.cartItem.create({ data: { cartId, productId: cprodId, quantity: 1 } });
    const order = await createOrderForUser(customerId, { addressId });
    const placed = await prisma.order.findUnique({ where: { id: order.id } });
    expect(placed?.status).toBe("PENDING");
    const total = placed!.total.toString();

    const res = await markOrderPaid(order.orderNumber, total);
    expect(res.ok && res.newlyPaid && res.confirmed).toBe(true);

    const db = await prisma.order.findUnique({
      where: { id: order.id },
      include: { statusLogs: true },
    });
    expect(db?.status).toBe("CONFIRMED");
    expect(db?.paymentStatus).toBe("PAID");
    expect(db?.statusLogs.some((l) => l.status === "CONFIRMED" && l.note?.includes("auto-confirmed"))).toBe(true);

    // Idempotent: a duplicate callback neither re-confirms nor errors.
    const again = await markOrderPaid(order.orderNumber, total);
    expect(again.ok && again.newlyPaid === false && again.confirmed === false).toBe(true);
  });

  it("cannot re-activate a cancelled order (no double stock, terminal)", async () => {
    await prisma.cartItem.deleteMany({ where: { cartId } });
    await prisma.cartItem.create({ data: { cartId, productId: cprodId, quantity: 2 } });
    const order = await createOrderForUser(customerId, { addressId });

    await updateOrderStatus(order.id, "CANCELLED", "cancel");
    const restocked = (await prisma.product.findUnique({ where: { id: cprodId } }))!.stock;

    // Attempt to move it back to an active state — must be refused.
    const res = await updateOrderStatus(order.id, "CONFIRMED");
    expect(res.ok).toBe(false);
    const stillCancelled = await prisma.order.findUnique({ where: { id: order.id } });
    expect(stillCancelled?.status).toBe("CANCELLED");
    // Stock must not have been double-counted by the failed re-activation.
    const after = (await prisma.product.findUnique({ where: { id: cprodId } }))!.stock;
    expect(after).toBe(restocked);
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
