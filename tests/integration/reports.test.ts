import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  getProductSalesReport,
  getCategorySalesReport,
  getBrandSalesReport,
  getProfitLoss,
  getCustomerPurchaseReport,
} from "@/lib/queries/admin-reports";
import { getSalesReport } from "@/lib/queries/admin-dashboard";
import { buildReportCsv } from "@/lib/reports/report-csv";

const TAG = `rep_${Date.now()}`;
let catSlug = "";
let prodAId = "";
let prodBId = "";
let userId = "";
let deliveredNo = "";
const brandXName = `BrandX ${TAG}`;
const brandYName = `BrandY ${TAG}`;

beforeAll(async () => {
  const cat = await prisma.category.create({ data: { name: `Cat ${TAG}`, slug: `cat-${TAG}` } });
  catSlug = cat.slug;
  const brandX = await prisma.brand.create({ data: { name: brandXName, slug: `bx-${TAG}` } });
  const brandY = await prisma.brand.create({ data: { name: brandYName, slug: `by-${TAG}` } });
  const a = await prisma.product.create({
    data: { name: `A ${TAG}`, slug: `a-${TAG}`, description: "d", price: "1000", costPrice: "600", stock: 100, categoryId: cat.id, brandId: brandX.id },
  });
  const b = await prisma.product.create({
    data: { name: `B ${TAG}`, slug: `b-${TAG}`, description: "d", price: "500", costPrice: "200", stock: 100, categoryId: cat.id, brandId: brandY.id },
  });
  prodAId = a.id;
  prodBId = b.id;

  const user = await prisma.user.create({
    data: { name: `Alice ${TAG}`, email: `${TAG}@t.local`, password: "x", role: "CUSTOMER" },
  });
  userId = user.id;
  const addr = await prisma.address.create({
    data: { userId, fullName: `Alice ${TAG}`, phone: "0171", line1: "L1", city: "Dhaka", isDefault: true },
  });

  const mkOrder = (
    no: string,
    status: "DELIVERED" | "PENDING" | "CANCELLED",
    totals: { subtotal: string; discount: string; shipping: string; total: string },
    items: { id: string; price: string; cost: string; qty: number }[],
  ) =>
    prisma.order.create({
      data: {
        orderNumber: no,
        userId,
        addressId: addr.id,
        subtotal: totals.subtotal,
        discount: totals.discount,
        shippingFee: totals.shipping,
        total: totals.total,
        status,
        items: {
          create: items.map((it) => ({ productId: it.id, name: "snap", price: it.price, cost: it.cost, quantity: it.qty })),
        },
      },
    });

  deliveredNo = `ORD-${TAG}-D`;
  await mkOrder(deliveredNo, "DELIVERED", { subtotal: "2500", discount: "100", shipping: "60", total: "2460" }, [
    { id: prodAId, price: "1000", cost: "600", qty: 2 },
    { id: prodBId, price: "500", cost: "200", qty: 1 },
  ]);
  await mkOrder(`ORD-${TAG}-P`, "PENDING", { subtotal: "1000", discount: "0", shipping: "60", total: "1060" }, [
    { id: prodAId, price: "1000", cost: "600", qty: 1 },
  ]);
  await mkOrder(`ORD-${TAG}-C`, "CANCELLED", { subtotal: "5000", discount: "0", shipping: "60", total: "5060" }, [
    { id: prodAId, price: "1000", cost: "600", qty: 5 },
  ]);
});

afterAll(async () => {
  await prisma.order.deleteMany({ where: { userId } });
  await prisma.address.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.product.deleteMany({ where: { slug: { in: [`a-${TAG}`, `b-${TAG}`] } } });
  await prisma.brand.deleteMany({ where: { slug: { in: [`bx-${TAG}`, `by-${TAG}`] } } });
  await prisma.category.deleteMany({ where: { slug: catSlug } });
  await prisma.$disconnect();
});

describe("getSalesReport filters", () => {
  it("excludes cancelled orders and can filter by customer", async () => {
    const r = await getSalesReport(undefined, undefined, { customer: `Alice ${TAG}` });
    expect(r.orders.map((o) => o.orderNumber).sort()).toEqual([`ORD-${TAG}-D`, `ORD-${TAG}-P`]);
  });

  it("filters by status", async () => {
    const r = await getSalesReport(undefined, undefined, { status: "DELIVERED", customer: `Alice ${TAG}` });
    expect(r.orders).toHaveLength(1);
    expect(r.orders[0]?.orderNumber).toBe(deliveredNo);
  });

  it("filters by order number", async () => {
    const r = await getSalesReport(undefined, undefined, { orderNumber: deliveredNo });
    expect(r.orders).toHaveLength(1);
    expect(r.orders[0]?.orderNumber).toBe(deliveredNo);
  });
});

describe("getProductSalesReport filters & sort", () => {
  it("scopes to a category", async () => {
    const rows = await getProductSalesReport(undefined, undefined, { categorySlug: catSlug });
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.category === `Cat ${TAG}`)).toBe(true);
  });

  it("filters to a single product", async () => {
    const rows = await getProductSalesReport(undefined, undefined, { categorySlug: catSlug, productId: prodAId });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.productId).toBe(prodAId);
    expect(rows[0]?.soldQty).toBeGreaterThan(0);
    expect(rows[0]?.profit).toBeDefined();
  });

  it("sorts by quantity sold", async () => {
    const rows = await getProductSalesReport(undefined, undefined, { categorySlug: catSlug, sort: "qty" });
    // Product A sold more units than B → comes first.
    expect(rows[0]?.productId).toBe(prodAId);
  });
});

describe("getCategorySalesReport", () => {
  it("scopes to a category and reports revenue/profit", async () => {
    const rows = await getCategorySalesReport(undefined, undefined, { categorySlug: catSlug });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.category).toBe(`Cat ${TAG}`);
    expect(rows[0]?.revenue).toBeDefined();
  });
});

describe("getBrandSalesReport", () => {
  it("groups sales by brand with units, revenue and profit (cancelled excluded)", async () => {
    const rows = await getBrandSalesReport();
    const x = rows.find((r) => r.brand === brandXName);
    const y = rows.find((r) => r.brand === brandYName);

    // BrandX = product A: 2 (delivered) + 1 (pending) = 3 units; cancelled 5 excluded.
    expect(x?.unitsSold).toBe(3);
    expect(Number(x?.revenue)).toBe(3000);
    expect(Number(x?.profit)).toBe(1200); // 3000 − (3 × 600)
    expect(x?.orders).toBe(2);

    // BrandY = product B: 1 unit.
    expect(y?.unitsSold).toBe(1);
    expect(Number(y?.revenue)).toBe(500);
    expect(Number(y?.profit)).toBe(300);
  });

  it("sorts brands by units sold", async () => {
    const rows = (await getBrandSalesReport(undefined, undefined, { sort: "units" })).filter((r) =>
      [brandXName, brandYName].includes(r.brand),
    );
    expect(rows[0]?.brand).toBe(brandXName); // 3 units > 1 unit
  });
});

describe("getProfitLoss", () => {
  it("derives Net Profit = Gross Revenue − Product Cost − Discounts", async () => {
    const p = await getProfitLoss();
    // Invariant holds regardless of other data in the DB.
    expect(p.grossProfit.toString()).toBe(p.grossRevenue.minus(p.productCost).toString());
    expect(p.netProfit.toString()).toBe(
      p.grossRevenue.minus(p.productCost).minus(p.discounts).toString(),
    );
    if (p.grossRevenue.greaterThan(0)) {
      expect(p.netMargin).toBeCloseTo(p.netProfit.div(p.grossRevenue).toNumber(), 6);
    }
  });
});

describe("getCustomerPurchaseReport", () => {
  it("aggregates spend, orders and AOV per customer (cancelled excluded)", async () => {
    const rows = await getCustomerPurchaseReport();
    const alice = rows.find((r) => r.name === `Alice ${TAG}`);
    expect(alice).toBeDefined();
    expect(alice?.totalOrders).toBe(2); // delivered + pending; cancelled excluded
    expect(Number(alice?.totalSpend)).toBe(3520); // 2460 + 1060
    expect(Number(alice?.avgOrderValue)).toBe(1760); // 3520 / 2
    expect(alice?.guest).toBe(false);
    expect(alice?.lastPurchase).toBeInstanceOf(Date);
  });

  it("can sort by total spend", async () => {
    const rows = await getCustomerPurchaseReport(undefined, undefined, { sort: "spend" });
    for (let i = 1; i < rows.length; i++) {
      expect(Number(rows[i - 1]!.totalSpend)).toBeGreaterThanOrEqual(Number(rows[i]!.totalSpend));
    }
  });
});

describe("buildReportCsv", () => {
  it("wraps a report with a header block and footer", async () => {
    const { filename, csv } = await buildReportCsv(new URLSearchParams("report=customers"));
    const lines = csv.split("\r\n");
    expect(filename).toBe("customer-purchases");
    // Header block: shop name, report title, period, generated.
    expect(lines[1]).toBe("Customer Purchase Report");
    expect(lines[2]).toMatch(/^Period: /);
    expect(lines[3]).toContain("Generated:");
    // Column header row appears after the preamble.
    expect(csv).toContain("Customer,Contact,Type,Total Orders,Total Spend");
    // Footer line.
    expect(csv).toContain("Confidential - for internal business use only");
  });

  it("titles each report type and includes the range in the period line", async () => {
    const { csv } = await buildReportCsv(new URLSearchParams("report=pnl&from=2026-07-01&to=2026-07-31"));
    expect(csv.split("\r\n")[1]).toBe("Profit & Loss Report");
    expect(csv).toContain("Period: 1 Jul 2026 - 31 Jul 2026");
    expect(csv).toContain("Net Profit");
  });
});
