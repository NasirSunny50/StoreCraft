import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeCartSubtotal } from "@/lib/cart-math";
import {
  computeOrderTotals,
  formatOrderNumber,
  canCancelOrder,
} from "@/lib/order-math";
import { getDeliveryFees, shippingFeeForCity } from "@/lib/settings";
import { validateCoupon } from "@/lib/coupon-math";
import type { AddressInput } from "@/lib/validators/address";

/** User-facing checkout failure (empty cart, no stock, bad address, …). */
export class CheckoutError extends Error {}

function isOrderNumberConflict(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    e.code === "P2002" &&
    String((e.meta as { target?: string[] })?.target ?? "").includes("orderNumber")
  );
}

async function generateOrderNumber(
  tx: Prisma.TransactionClient,
  year: number,
): Promise<string> {
  const count = await tx.order.count({
    where: { orderNumber: { startsWith: `ORD-${year}-` } },
  });
  return formatOrderNumber(year, count + 1);
}

export type PlacedOrder = { id: string; orderNumber: string };

/**
 * Create an order from the user's cart. Stock is decremented with an atomic
 * conditional update (updateMany with `stock >= qty`) so concurrent checkouts
 * can never oversell. The whole thing runs in a transaction — any failure
 * (incl. an order-number race) rolls back stock too.
 */
export type CreateOrderInput = {
  addressId: string;
  note?: string;
  couponCode?: string;
  paymentMethod?: "COD" | "SSLCOMMERZ";
};

export async function createOrderForUser(
  userId: string,
  input: CreateOrderInput,
): Promise<PlacedOrder> {
  return withOrderNumberRetry(() => placeOnce(userId, input));
}

/** Guest checkout: no account, contact captured on a throwaway shipping address. */
export type CreateGuestOrderInput = {
  sessionId: string;
  address: AddressInput;
  email?: string;
  note?: string;
  couponCode?: string;
  paymentMethod?: "COD" | "SSLCOMMERZ";
};

export async function createGuestOrder(
  input: CreateGuestOrderInput,
): Promise<PlacedOrder> {
  return withOrderNumberRetry(() => placeGuestOnce(input));
}

/** Retry the order-number generation on the rare concurrent-collision race. */
async function withOrderNumberRetry(
  fn: () => Promise<PlacedOrder>,
): Promise<PlacedOrder> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (isOrderNumberConflict(e) && attempt < 2) continue;
      throw e;
    }
  }
  // Unreachable, but keeps the type checker happy.
  throw new CheckoutError("Could not place order. Please try again.");
}

type LiveCartItem = {
  productId: string;
  quantity: number;
  color: string;
  product: { name: string; price: Prisma.Decimal; costPrice: Prisma.Decimal };
};

/** Delivery address for an order — an existing saved row, or guest data to create. */
type OrderAddress =
  | { kind: "existing"; id: string; city: string }
  | { kind: "guest"; data: AddressInput };

/**
 * Shared order-persistence core for both user and guest checkout. Prices the
 * cart, validates the coupon, then (atomically) decrements stock, consumes the
 * coupon, snapshots items, and clears the cart. `userId` is null for guests.
 */
async function finalizeOrder(params: {
  userId: string | null;
  guestEmail?: string;
  cartId: string;
  liveItems: LiveCartItem[];
  address: OrderAddress;
  note?: string;
  couponCode?: string;
  paymentMethod: "COD" | "SSLCOMMERZ";
}): Promise<PlacedOrder> {
  const { userId, guestEmail, cartId, liveItems, address } = params;

  const subtotal = computeCartSubtotal(
    liveItems.map((i) => ({ price: i.product.price, quantity: i.quantity })),
  );

  // Optional coupon — validated against the live subtotal.
  let couponId: string | undefined;
  let couponDiscount: Prisma.Decimal = new Prisma.Decimal(0);
  if (params.couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: params.couponCode.trim().toUpperCase() },
    });
    if (!coupon) throw new CheckoutError("Invalid coupon code.");
    const check = validateCoupon(coupon, subtotal);
    if (!check.valid) throw new CheckoutError(check.reason);
    couponId = coupon.id;
    couponDiscount = check.discount;
  }

  // Delivery charge depends on the destination city (Inside vs Outside Dhaka).
  const city = address.kind === "existing" ? address.city : address.data.city;
  const shippingValue = shippingFeeForCity(city, await getDeliveryFees());
  const { shippingFee, discount, total } = computeOrderTotals({
    subtotal,
    shippingFee: shippingValue,
    discount: couponDiscount,
  });
  const year = new Date().getFullYear();

  return prisma.$transaction(async (tx) => {
    for (const item of liveItems) {
      const res = await tx.product.updateMany({
        where: {
          id: item.productId,
          isActive: true,
          isDeleted: false,
          stock: { gte: item.quantity },
        },
        data: { stock: { decrement: item.quantity } },
      });
      if (res.count === 0) {
        throw new CheckoutError(
          `Insufficient stock for "${item.product.name}". Please adjust your cart.`,
        );
      }
    }

    // Re-check + consume coupon usage inside the transaction.
    if (couponId) {
      const c = await tx.coupon.findUnique({ where: { id: couponId } });
      if (!c || !c.isActive) throw new CheckoutError("Coupon is no longer valid.");
      if (c.usageLimit != null && c.usedCount >= c.usageLimit) {
        throw new CheckoutError("This coupon has reached its usage limit.");
      }
      await tx.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Resolve the shipping address — create a throwaway (ownerless) row for guests.
    const addressId =
      address.kind === "existing"
        ? address.id
        : (
            await tx.address.create({
              data: {
                userId: null,
                fullName: address.data.fullName,
                phone: address.data.phone,
                line1: address.data.line1,
                line2: address.data.line2 ?? null,
                city: address.data.city,
                area: address.data.area ?? null,
                postcode: address.data.postcode ?? null,
                isDefault: false,
              },
            })
          ).id;

    const orderNumber = await generateOrderNumber(tx, year);
    const order = await tx.order.create({
      data: {
        orderNumber,
        userId,
        guestEmail: guestEmail ?? null,
        addressId,
        couponId: couponId ?? null,
        subtotal,
        shippingFee,
        discount,
        total,
        status: "PENDING",
        paymentMethod: params.paymentMethod,
        paymentStatus: "UNPAID",
        note: params.note ?? null,
        items: {
          create: liveItems.map((i) => ({
            productId: i.productId,
            name: i.product.name, // snapshot
            price: i.product.price, // snapshot
            cost: i.product.costPrice, // snapshot of unit cost for accurate profit
            quantity: i.quantity,
            color: i.color, // snapshot of chosen colour
          })),
        },
        statusLogs: {
          create: { status: "PENDING", note: "Order placed", changedBy: userId },
        },
      },
    });

    await tx.stockLog.createMany({
      data: liveItems.map((i) => ({
        productId: i.productId,
        change: -i.quantity,
        reason: "SALE",
        changedBy: userId,
      })),
    });

    await tx.cartItem.deleteMany({ where: { cartId } });

    return { id: order.id, orderNumber: order.orderNumber };
  });
}

async function placeOnce(
  userId: string,
  input: CreateOrderInput,
): Promise<PlacedOrder> {
  // A JWT session stays valid until it expires, so re-check the block flag here
  // — a customer blocked mid-session must not be able to place orders.
  const account = await prisma.user.findUnique({
    where: { id: userId },
    select: { isBlocked: true },
  });
  if (!account) throw new CheckoutError("Account not found.");
  if (account.isBlocked) throw new CheckoutError("Your account has been blocked.");

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });
  const liveItems = (cart?.items ?? []).filter(
    (i) => i.product.isActive && !i.product.isDeleted,
  );
  if (!cart || liveItems.length === 0) {
    throw new CheckoutError("Your cart is empty.");
  }

  const address = await prisma.address.findFirst({
    where: { id: input.addressId, userId },
  });
  if (!address) throw new CheckoutError("Delivery address not found.");

  return finalizeOrder({
    userId,
    cartId: cart.id,
    liveItems,
    address: { kind: "existing", id: address.id, city: address.city },
    note: input.note,
    couponCode: input.couponCode,
    paymentMethod: input.paymentMethod ?? "COD",
  });
}

async function placeGuestOnce(
  input: CreateGuestOrderInput,
): Promise<PlacedOrder> {
  const cart = await prisma.cart.findUnique({
    where: { sessionId: input.sessionId },
    include: { items: { include: { product: true } } },
  });
  const liveItems = (cart?.items ?? []).filter(
    (i) => i.product.isActive && !i.product.isDeleted,
  );
  if (!cart || liveItems.length === 0) {
    throw new CheckoutError("Your cart is empty.");
  }

  return finalizeOrder({
    userId: null,
    guestEmail: input.email,
    cartId: cart.id,
    liveItems,
    address: { kind: "guest", data: input.address },
    note: input.note,
    couponCode: input.couponCode,
    paymentMethod: input.paymentMethod ?? "COD",
  });
}

export type MarkPaidResult =
  | { ok: true; orderId: string; newlyPaid: boolean; confirmed: boolean }
  | { ok: false; reason: "not-found" | "cancelled" | "amount-mismatch" };

/**
 * Mark an SSLCommerz order paid after server-side validation. Idempotent
 * (re-running for an already-paid order is a no-op success) and amount-checked
 * (a validated amount that doesn't match the order total is rejected). Only
 * called from payment callbacks after validateSslcommerzPayment succeeds.
 */
export async function markOrderPaid(
  orderNumber: string,
  validatedAmount: string | null,
): Promise<MarkPaidResult> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { orderNumber } });
    if (!order) return { ok: false, reason: "not-found" };
    if (order.paymentStatus === "PAID") {
      return { ok: true, orderId: order.id, newlyPaid: false, confirmed: false };
    }
    if (order.status === "CANCELLED") return { ok: false, reason: "cancelled" };

    if (validatedAmount != null && !new Prisma.Decimal(validatedAmount).equals(order.total)) {
      return { ok: false, reason: "amount-mismatch" };
    }

    // Payment is proof enough — a paid online order auto-confirms (no phone
    // confirmation needed). Only advance a PENDING order; if staff already moved
    // it further, leave that status alone.
    const confirmed = order.status === "PENDING";
    const nextStatus = confirmed ? "CONFIRMED" : order.status;
    await tx.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PAID", status: nextStatus },
    });
    await tx.orderStatusLog.create({
      data: {
        orderId: order.id,
        status: nextStatus,
        note: confirmed
          ? "Payment received (SSLCommerz) — auto-confirmed"
          : "Payment received (SSLCommerz)",
        changedBy: order.userId,
      },
    });
    return { ok: true, orderId: order.id, newlyPaid: true, confirmed };
  });
}

/**
 * System-initiated fail/cancel of an unpaid online order: restock and cancel.
 * Never touches a paid or already-cancelled order. Used by the fail/cancel
 * payment callbacks (verified via signature before calling).
 */
export async function failOrderPaymentByNumber(orderNumber: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });
    if (!order) return;
    if (order.paymentStatus === "PAID" || order.status === "CANCELLED") return;

    for (const item of order.items) {
      await tx.product.updateMany({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
    await tx.stockLog.createMany({
      data: order.items.map((i) => ({
        productId: i.productId,
        change: i.quantity,
        reason: "CANCEL",
        changedBy: order.userId,
      })),
    });
    await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    await tx.orderStatusLog.create({
      data: {
        orderId: order.id,
        status: "CANCELLED",
        note: "Online payment failed or cancelled",
        changedBy: order.userId,
      },
    });
  });
}

/** Cancel a PENDING order and restock its items (atomic). Returns order number. */
export async function cancelOrder(
  userId: string,
  orderId: string,
): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });
    if (!order) throw new CheckoutError("Order not found.");
    if (!canCancelOrder(order.status)) {
      throw new CheckoutError("Only pending orders can be cancelled.");
    }
    if (order.paymentStatus === "PAID") {
      throw new CheckoutError(
        "This order has already been paid — please contact support to cancel it.",
      );
    }

    for (const item of order.items) {
      await tx.product.updateMany({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }
    await tx.stockLog.createMany({
      data: order.items.map((i) => ({
        productId: i.productId,
        change: i.quantity,
        reason: "CANCEL",
        changedBy: userId,
      })),
    });
    await tx.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
    await tx.orderStatusLog.create({
      data: {
        orderId: order.id,
        status: "CANCELLED",
        note: "Cancelled by customer",
        changedBy: userId,
      },
    });
    return order.orderNumber;
  });
}
