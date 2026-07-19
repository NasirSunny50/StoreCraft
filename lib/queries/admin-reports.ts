import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Order.createdAt filter for a date range (empty when no range given). */
function rangeWhere(from?: Date, to?: Date): Prisma.OrderWhereInput {
  if (!from && !to) return {};
  const createdAt: Prisma.DateTimeFilter = {};
  if (from) createdAt.gte = from;
  if (to) createdAt.lte = to;
  return { createdAt };
}

const D = (v: Prisma.Decimal | null | undefined) => v ?? new Prisma.Decimal(0);
const ZERO = new Prisma.Decimal(0);

// ---------- 1. Sales Summary ----------
export type SalesSummary = {
  totalOrders: number;
  totalSales: Prisma.Decimal; // what customers paid (incl. shipping)
  grossRevenue: Prisma.Decimal; // merchandise value before discount
  netRevenue: Prisma.Decimal; // merchandise value after discount
  totalDiscount: Prisma.Decimal;
  totalShipping: Prisma.Decimal;
  avgOrderValue: Prisma.Decimal;
  totalCost: Prisma.Decimal; // cost of goods sold (cost price × qty)
  grossProfit: Prisma.Decimal; // gross revenue − COGS
  profitMargin: number; // grossProfit / grossRevenue (0..1)
  itemsSold: number;
  paidOrders: number;
  paidSales: Prisma.Decimal;
  codOrders: number;
  onlineOrders: number;
  cancelledOrders: number;
  cancellationRate: number; // 0..1
};

export async function getSalesSummary(from?: Date, to?: Date): Promise<SalesSummary> {
  const range = rangeWhere(from, to);
  const soldWhere: Prisma.OrderWhereInput = { status: { not: "CANCELLED" }, ...range };

  const [agg, orderCount, cancelledOrders, paidAgg, itemsAgg, methods, costItems] = await Promise.all([
    prisma.order.aggregate({
      _sum: { subtotal: true, discount: true, shippingFee: true, total: true },
      where: soldWhere,
    }),
    prisma.order.count({ where: soldWhere }),
    prisma.order.count({ where: { status: "CANCELLED", ...range } }),
    prisma.order.aggregate({ _sum: { total: true }, _count: { _all: true }, where: { ...soldWhere, paymentStatus: "PAID" } }),
    prisma.orderItem.aggregate({ _sum: { quantity: true }, where: { order: soldWhere } }),
    prisma.order.groupBy({ by: ["paymentMethod"], _count: { _all: true }, where: soldWhere }),
    prisma.orderItem.findMany({ where: { order: soldWhere }, select: { quantity: true, cost: true } }),
  ]);

  const grossRevenue = D(agg._sum.subtotal);
  const totalDiscount = D(agg._sum.discount);
  const totalShipping = D(agg._sum.shippingFee);
  const totalSales = D(agg._sum.total);
  const netRevenue = grossRevenue.minus(totalDiscount);
  const avgOrderValue = orderCount > 0 ? totalSales.div(orderCount) : ZERO;
  const totalCost = costItems.reduce((s, i) => s.plus(i.cost.times(i.quantity)), ZERO);
  const grossProfit = grossRevenue.minus(totalCost);
  const profitMargin = grossRevenue.greaterThan(0) ? grossProfit.div(grossRevenue).toNumber() : 0;
  const denom = orderCount + cancelledOrders;

  const codOrders = methods.find((m) => m.paymentMethod === "COD")?._count._all ?? 0;
  const onlineOrders = methods.find((m) => m.paymentMethod === "SSLCOMMERZ")?._count._all ?? 0;

  return {
    totalOrders: orderCount,
    totalSales,
    grossRevenue,
    netRevenue,
    totalDiscount,
    totalShipping,
    avgOrderValue,
    totalCost,
    grossProfit,
    profitMargin,
    itemsSold: itemsAgg._sum.quantity ?? 0,
    paidOrders: paidAgg._count._all,
    paidSales: D(paidAgg._sum.total),
    codOrders,
    onlineOrders,
    cancelledOrders,
    cancellationRate: denom > 0 ? cancelledOrders / denom : 0,
  };
}

// ---------- shared line-item fetch ----------
type SalesItem = {
  productId: string;
  orderId: string;
  price: Prisma.Decimal;
  quantity: number;
  cancelled: boolean;
  productName: string;
  cost: Prisma.Decimal; // snapshot unit cost at sale time
  categoryName: string;
  categorySlug: string;
  brandName: string; // "No brand" when the product has no brand
};

async function fetchSalesItems(from?: Date, to?: Date): Promise<SalesItem[]> {
  // All items in range (incl. cancelled orders) so we can derive cancellation rate.
  const rows = await prisma.orderItem.findMany({
    where: { order: rangeWhere(from, to) },
    select: {
      productId: true,
      orderId: true,
      price: true,
      cost: true,
      quantity: true,
      order: { select: { status: true } },
      product: {
        select: {
          name: true,
          category: { select: { name: true, slug: true } },
          brand: { select: { name: true } },
        },
      },
    },
  });
  return rows.map((r) => ({
    productId: r.productId,
    orderId: r.orderId,
    price: r.price,
    quantity: r.quantity,
    cancelled: r.order.status === "CANCELLED",
    productName: r.product.name,
    cost: r.cost,
    categoryName: r.product.category.name,
    categorySlug: r.product.category.slug,
    brandName: r.product.brand?.name ?? "No brand",
  }));
}

export type ProductSort = "revenue" | "profit" | "margin" | "qty";
export type CategorySort = "revenue" | "profit" | "margin";

// ---------- 2. Product-wise Sales ----------
export type ProductSalesRow = {
  productId: string;
  name: string;
  category: string;
  soldQty: number;
  revenue: Prisma.Decimal;
  profit: Prisma.Decimal; // revenue − cost (current cost price)
  margin: number; // profit / revenue (0..1)
  cancelledQty: number;
  cancellationRate: number; // 0..1
};

export async function getProductSalesReport(
  from?: Date,
  to?: Date,
  opts: { categorySlug?: string; productId?: string; sort?: ProductSort } = {},
): Promise<ProductSalesRow[]> {
  const all = await fetchSalesItems(from, to);
  const items = all.filter(
    (i) =>
      (!opts.categorySlug || i.categorySlug === opts.categorySlug) &&
      (!opts.productId || i.productId === opts.productId),
  );
  const map = new Map<
    string,
    { name: string; category: string; soldQty: number; revenue: Prisma.Decimal; cost: Prisma.Decimal; cancelledQty: number }
  >();

  for (const it of items) {
    let g = map.get(it.productId);
    if (!g) {
      g = { name: it.productName, category: it.categoryName, soldQty: 0, revenue: ZERO, cost: ZERO, cancelledQty: 0 };
      map.set(it.productId, g);
    }
    if (it.cancelled) {
      g.cancelledQty += it.quantity;
    } else {
      g.soldQty += it.quantity;
      g.revenue = g.revenue.plus(it.price.times(it.quantity));
      g.cost = g.cost.plus(it.cost.times(it.quantity));
    }
  }

  return [...map.entries()]
    .map(([productId, g]) => {
      const denom = g.soldQty + g.cancelledQty;
      const profit = g.revenue.minus(g.cost);
      return {
        productId,
        name: g.name,
        category: g.category,
        soldQty: g.soldQty,
        revenue: g.revenue,
        profit,
        margin: g.revenue.greaterThan(0) ? profit.div(g.revenue).toNumber() : 0,
        cancelledQty: g.cancelledQty,
        cancellationRate: denom > 0 ? g.cancelledQty / denom : 0,
      };
    })
    .sort((a, b) => {
      switch (opts.sort) {
        case "profit": return b.profit.comparedTo(a.profit);
        case "margin": return b.margin - a.margin;
        case "qty": return b.soldQty - a.soldQty;
        default: return b.revenue.comparedTo(a.revenue);
      }
    });
}

// ---------- 3. Category-wise Sales ----------
export type CategorySalesRow = {
  category: string;
  orders: number; // distinct orders containing a product in this category
  itemsSold: number;
  revenue: Prisma.Decimal;
  profit: Prisma.Decimal;
  margin: number; // profit / revenue (0..1)
};

export async function getCategorySalesReport(
  from?: Date,
  to?: Date,
  opts: { categorySlug?: string; sort?: CategorySort } = {},
): Promise<CategorySalesRow[]> {
  const all = await fetchSalesItems(from, to);
  const items = opts.categorySlug ? all.filter((i) => i.categorySlug === opts.categorySlug) : all;
  const map = new Map<
    string,
    { orders: Set<string>; itemsSold: number; revenue: Prisma.Decimal; cost: Prisma.Decimal }
  >();

  for (const it of items) {
    if (it.cancelled) continue;
    let g = map.get(it.categoryName);
    if (!g) {
      g = { orders: new Set(), itemsSold: 0, revenue: ZERO, cost: ZERO };
      map.set(it.categoryName, g);
    }
    g.orders.add(it.orderId);
    g.itemsSold += it.quantity;
    g.revenue = g.revenue.plus(it.price.times(it.quantity));
    g.cost = g.cost.plus(it.cost.times(it.quantity));
  }

  return [...map.entries()]
    .map(([category, g]) => {
      const profit = g.revenue.minus(g.cost);
      return {
        category,
        orders: g.orders.size,
        itemsSold: g.itemsSold,
        revenue: g.revenue,
        profit,
        margin: g.revenue.greaterThan(0) ? profit.div(g.revenue).toNumber() : 0,
      };
    })
    .sort((a, b) => {
      switch (opts.sort) {
        case "profit": return b.profit.comparedTo(a.profit);
        case "margin": return b.margin - a.margin;
        default: return b.revenue.comparedTo(a.revenue);
      }
    });
}

// ---------- 5. Brand-wise Sales ----------
export type BrandSort = "revenue" | "profit" | "units" | "margin";
export type BrandSalesRow = {
  brand: string;
  orders: number; // distinct orders containing a product of this brand
  unitsSold: number;
  revenue: Prisma.Decimal;
  profit: Prisma.Decimal;
  margin: number; // profit / revenue (0..1)
};

/** Sales grouped by product brand — for brand performance & supplier talks. */
export async function getBrandSalesReport(
  from?: Date,
  to?: Date,
  opts: { sort?: BrandSort } = {},
): Promise<BrandSalesRow[]> {
  const items = (await fetchSalesItems(from, to)).filter((i) => !i.cancelled);
  const map = new Map<
    string,
    { orders: Set<string>; unitsSold: number; revenue: Prisma.Decimal; cost: Prisma.Decimal }
  >();

  for (const it of items) {
    let g = map.get(it.brandName);
    if (!g) {
      g = { orders: new Set(), unitsSold: 0, revenue: ZERO, cost: ZERO };
      map.set(it.brandName, g);
    }
    g.orders.add(it.orderId);
    g.unitsSold += it.quantity;
    g.revenue = g.revenue.plus(it.price.times(it.quantity));
    g.cost = g.cost.plus(it.cost.times(it.quantity));
  }

  return [...map.entries()]
    .map(([brand, g]) => {
      const profit = g.revenue.minus(g.cost);
      return {
        brand,
        orders: g.orders.size,
        unitsSold: g.unitsSold,
        revenue: g.revenue,
        profit,
        margin: g.revenue.greaterThan(0) ? profit.div(g.revenue).toNumber() : 0,
      };
    })
    .sort((a, b) => {
      switch (opts.sort) {
        case "profit": return b.profit.comparedTo(a.profit);
        case "units": return b.unitsSold - a.unitsSold;
        case "margin": return b.margin - a.margin;
        default: return b.revenue.comparedTo(a.revenue);
      }
    });
}

// ---------- 6. Profit & Loss ----------
export type ProfitLoss = {
  grossRevenue: Prisma.Decimal; // merchandise before discount
  productCost: Prisma.Decimal; // COGS (cost price × qty)
  grossProfit: Prisma.Decimal; // grossRevenue − productCost
  discounts: Prisma.Decimal; // order-level discounts given
  shippingCollected: Prisma.Decimal; // shipping charged to customers (pass-through)
  netProfit: Prisma.Decimal; // grossRevenue − productCost − discounts
  netMargin: number; // netProfit / grossRevenue (0..1)
  orders: number;
  itemsSold: number;
};

/** Actual profitability, derived from the sales summary. */
export async function getProfitLoss(from?: Date, to?: Date): Promise<ProfitLoss> {
  const s = await getSalesSummary(from, to);
  const netProfit = s.grossRevenue.minus(s.totalCost).minus(s.totalDiscount);
  return {
    grossRevenue: s.grossRevenue,
    productCost: s.totalCost,
    grossProfit: s.grossProfit,
    discounts: s.totalDiscount,
    shippingCollected: s.totalShipping,
    netProfit,
    netMargin: s.grossRevenue.greaterThan(0) ? netProfit.div(s.grossRevenue).toNumber() : 0,
    orders: s.totalOrders,
    itemsSold: s.itemsSold,
  };
}

// ---------- 7. Customer Purchase ----------
export type CustomerSort = "spend" | "orders" | "aov" | "recent";
export type CustomerRow = {
  name: string;
  contact: string; // email or phone
  guest: boolean;
  totalOrders: number;
  totalSpend: Prisma.Decimal; // sum of order totals (incl. shipping)
  avgOrderValue: Prisma.Decimal;
  firstPurchase: Date;
  lastPurchase: Date;
};

/** Purchases grouped per customer — VIPs & lifetime value. Excludes cancelled. */
export async function getCustomerPurchaseReport(
  from?: Date,
  to?: Date,
  opts: { sort?: CustomerSort } = {},
): Promise<CustomerRow[]> {
  const orders = await prisma.order.findMany({
    where: { status: { not: "CANCELLED" }, ...rangeWhere(from, to) },
    select: {
      userId: true,
      guestEmail: true,
      total: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
      address: { select: { fullName: true, phone: true } },
    },
  });

  type Group = {
    name: string;
    contact: string;
    guest: boolean;
    totalOrders: number;
    totalSpend: Prisma.Decimal;
    firstPurchase: Date;
    lastPurchase: Date;
  };
  const map = new Map<string, Group>();

  for (const o of orders) {
    const guest = !o.userId;
    const key = o.userId ?? `guest:${o.guestEmail ?? o.address.phone}`;
    const name = o.user?.name ?? o.address.fullName;
    const contact = o.user?.email ?? o.guestEmail ?? o.address.phone;

    let g = map.get(key);
    if (!g) {
      g = { name, contact, guest, totalOrders: 0, totalSpend: ZERO, firstPurchase: o.createdAt, lastPurchase: o.createdAt };
      map.set(key, g);
    }
    g.totalOrders += 1;
    g.totalSpend = g.totalSpend.plus(o.total);
    if (o.createdAt < g.firstPurchase) g.firstPurchase = o.createdAt;
    if (o.createdAt > g.lastPurchase) g.lastPurchase = o.createdAt;
  }

  return [...map.values()]
    .map((g) => ({
      ...g,
      avgOrderValue: g.totalOrders > 0 ? g.totalSpend.div(g.totalOrders) : ZERO,
    }))
    .sort((a, b) => {
      switch (opts.sort) {
        case "orders": return b.totalOrders - a.totalOrders;
        case "aov": return b.avgOrderValue.comparedTo(a.avgOrderValue);
        case "recent": return b.lastPurchase.getTime() - a.lastPurchase.getTime();
        default: return b.totalSpend.comparedTo(a.totalSpend);
      }
    });
}
