import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { capQuantity, computeCartSubtotal, computeCartCount } from "@/lib/cart-math";

const CART_COOKIE = "cartSessionId";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const cartInclude = {
  items: {
    orderBy: { id: "asc" as const },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          stock: true,
          isActive: true,
          isDeleted: true,
          images: { orderBy: { position: "asc" as const }, take: 1 },
        },
      },
    },
  },
} as const;

export type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** The current guest cart's session id from the cookie, if any (read-only). */
export async function getGuestCartSessionId(): Promise<string | null> {
  return (await cookies()).get(CART_COOKIE)?.value ?? null;
}

/**
 * Read-only cart resolution — safe to call from Server Components. Never writes
 * cookies or rows. Returns null when there is no cart yet.
 */
export async function getCart(): Promise<CartWithItems | null> {
  const userId = await getSessionUserId();
  if (userId) {
    return prisma.cart.findUnique({ where: { userId }, include: cartInclude });
  }
  const sid = (await cookies()).get(CART_COOKIE)?.value;
  if (!sid) return null;
  return prisma.cart.findUnique({ where: { sessionId: sid }, include: cartInclude });
}

/**
 * Ensures a cart row exists for the current user/guest. May set the guest cookie
 * and create rows, so only call from Server Actions / Route Handlers.
 */
export async function getOrCreateCart(): Promise<CartWithItems> {
  const userId = await getSessionUserId();
  if (userId) {
    return prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
      include: cartInclude,
    });
  }

  const cookieStore = await cookies();
  const existingSid = cookieStore.get(CART_COOKIE)?.value;
  if (existingSid) {
    const existing = await prisma.cart.findUnique({
      where: { sessionId: existingSid },
      include: cartInclude,
    });
    if (existing) return existing;
  }

  const sid = randomUUID();
  cookieStore.set(CART_COOKIE, sid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
  return prisma.cart.create({ data: { sessionId: sid }, include: cartInclude });
}

export type CartMutationResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Add `qty` of a product to the cart, capping at available stock. Does NOT
 * decrement stock (that happens at checkout, Phase 3).
 */
export async function addToCart(
  productId: string,
  qty = 1,
  color = "",
): Promise<CartMutationResult> {
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true, isDeleted: false },
    select: { stock: true, colors: true },
  });
  if (!product) return { ok: false, error: "Product not found." };
  if (product.stock <= 0) return { ok: false, error: "This product is out of stock." };

  // Only accept a colour the product actually offers (ignore arbitrary input).
  const safeColor = color && product.colors.includes(color) ? color : "";

  const cart = await getOrCreateCart();
  const existing = cart.items.find((i) => i.productId === productId);
  const desired = (existing?.quantity ?? 0) + qty;
  const finalQty = capQuantity(desired, product.stock);

  if (finalQty <= 0) return { ok: false, error: "Invalid quantity." };

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    update: { quantity: finalQty, color: safeColor },
    create: { cartId: cart.id, productId, quantity: finalQty, color: safeColor },
  });

  const capped = existing
    ? finalQty < desired
    : finalQty < qty;
  return capped
    ? { ok: false, error: `Only ${product.stock} in stock — quantity adjusted.` }
    : { ok: true };
}

/** Set an item's quantity directly (capped at stock). qty<=0 removes it. */
export async function updateCartItem(
  productId: string,
  qty: number,
): Promise<CartMutationResult> {
  const cart = await getCart();
  if (!cart) return { ok: false, error: "Cart not found." };
  const item = cart.items.find((i) => i.productId === productId);
  if (!item) return { ok: false, error: "Item not in cart." };

  const finalQty = capQuantity(qty, item.product.stock);
  if (finalQty <= 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
    return { ok: true };
  }

  await prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity: finalQty },
  });
  return finalQty < Math.floor(qty)
    ? { ok: false, error: `Only ${item.product.stock} in stock — quantity adjusted.` }
    : { ok: true };
}

export async function removeCartItem(productId: string): Promise<CartMutationResult> {
  const cart = await getCart();
  if (!cart) return { ok: false, error: "Cart not found." };
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  return { ok: true };
}

/** Filter out lines whose product is gone/inactive, for safe display + totals. */
export function liveCartItems(cart: CartWithItems | null) {
  if (!cart) return [];
  return cart.items.filter(
    (i) => i.product.isActive && !i.product.isDeleted,
  );
}

export function cartSubtotal(cart: CartWithItems | null): Prisma.Decimal {
  return computeCartSubtotal(
    liveCartItems(cart).map((i) => ({ price: i.product.price, quantity: i.quantity })),
  );
}

export function cartCount(cart: CartWithItems | null): number {
  return computeCartCount(liveCartItems(cart).map((i) => ({ quantity: i.quantity })));
}

/**
 * Merge a guest cart (from cookie) into the logged-in user's cart, then discard
 * the guest cart + cookie. Call right after a successful sign-in.
 */
export async function mergeGuestCartIntoUser(userId: string): Promise<void> {
  const cookieStore = await cookies();
  const sid = cookieStore.get(CART_COOKIE)?.value;
  if (!sid) return;

  const guestCart = await prisma.cart.findUnique({
    where: { sessionId: sid },
    include: { items: { include: { product: { select: { stock: true } } } } },
  });

  // Always clear the guest cookie once we've taken its session into account.
  cookieStore.delete(CART_COOKIE);
  if (!guestCart || guestCart.items.length === 0) {
    if (guestCart) await prisma.cart.delete({ where: { id: guestCart.id } });
    return;
  }

  const userCart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: { items: true },
  });

  await prisma.$transaction(async (tx) => {
    for (const gItem of guestCart.items) {
      const existing = userCart.items.find((i) => i.productId === gItem.productId);
      const merged = capQuantity(
        (existing?.quantity ?? 0) + gItem.quantity,
        gItem.product.stock,
      );
      if (merged <= 0) continue;
      await tx.cartItem.upsert({
        where: { cartId_productId: { cartId: userCart.id, productId: gItem.productId } },
        update: { quantity: merged, color: gItem.color },
        create: { cartId: userCart.id, productId: gItem.productId, quantity: merged, color: gItem.color },
      });
    }
    await tx.cart.delete({ where: { id: guestCart.id } });
  });
}
