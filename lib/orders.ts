import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeCartSubtotal } from "@/lib/cart-math";
import {
  computeOrderTotals,
  formatOrderNumber,
  canCancelOrder,
  SHIPPING_FEE,
} from "@/lib/order-math";
import { validateCoupon } from "@/lib/coupon-math";

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
export async function createOrderForUser(
  userId: string,
  input: { addressId: string; note?: string; couponCode?: string },
): Promise<PlacedOrder> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await placeOnce(userId, input);
    } catch (e) {
      if (isOrderNumberConflict(e) && attempt < 2) continue;
      throw e;
    }
  }
  // Unreachable, but keeps the type checker happy.
  throw new CheckoutError("Could not place order. Please try again.");
}

async function placeOnce(
  userId: string,
  input: { addressId: string; note?: string; couponCode?: string },
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

  const subtotal = computeCartSubtotal(
    liveItems.map((i) => ({ price: i.product.price, quantity: i.quantity })),
  );

  // Optional coupon — validated against the live subtotal.
  let couponId: string | undefined;
  let couponDiscount: Prisma.Decimal = new Prisma.Decimal(0);
  if (input.couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: input.couponCode.trim().toUpperCase() },
    });
    if (!coupon) throw new CheckoutError("Invalid coupon code.");
    const check = validateCoupon(coupon, subtotal);
    if (!check.valid) throw new CheckoutError(check.reason);
    couponId = coupon.id;
    couponDiscount = check.discount;
  }

  const { shippingFee, discount, total } = computeOrderTotals({
    subtotal,
    shippingFee: SHIPPING_FEE,
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

    const orderNumber = await generateOrderNumber(tx, year);
    const order = await tx.order.create({
      data: {
        orderNumber,
        userId,
        addressId: address.id,
        couponId: couponId ?? null,
        subtotal,
        shippingFee,
        discount,
        total,
        status: "PENDING",
        paymentMethod: "COD",
        paymentStatus: "UNPAID",
        note: input.note ?? null,
        items: {
          create: liveItems.map((i) => ({
            productId: i.productId,
            name: i.product.name, // snapshot
            price: i.product.price, // snapshot
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

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return { id: order.id, orderNumber: order.orderNumber };
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
