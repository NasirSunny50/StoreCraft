import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { addToCart, type CartMutationResult } from "@/lib/cart";

const wishlistInclude = {
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

export type WishlistWithItems = Prisma.WishlistGetPayload<{
  include: typeof wishlistInclude;
}>;

async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function getWishlist(): Promise<WishlistWithItems | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return prisma.wishlist.findUnique({ where: { userId }, include: wishlistInclude });
}

export async function addToWishlist(
  productId: string,
): Promise<CartMutationResult> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Please log in to use your wishlist." };

  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true, isDeleted: false },
    select: { id: true },
  });
  if (!product) return { ok: false, error: "Product not found." };

  const wishlist = await prisma.wishlist.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  await prisma.wishlistItem.upsert({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
    update: {},
    create: { wishlistId: wishlist.id, productId },
  });
  return { ok: true };
}

export async function removeFromWishlist(
  productId: string,
): Promise<CartMutationResult> {
  const userId = await getSessionUserId();
  if (!userId) return { ok: false, error: "Please log in." };
  const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) return { ok: true };
  await prisma.wishlistItem.deleteMany({
    where: { wishlistId: wishlist.id, productId },
  });
  return { ok: true };
}

export async function moveToCart(productId: string): Promise<CartMutationResult> {
  const added = await addToCart(productId, 1);
  // If stock was capped, addToCart returns ok:false with an informational
  // message but the item IS in the cart — only block on hard failures.
  if (!added.ok && !added.error.includes("in stock")) return added;
  await removeFromWishlist(productId);
  return added.ok ? { ok: true } : added;
}

export function wishlistCount(wishlist: WishlistWithItems | null): number {
  return wishlist?.items.length ?? 0;
}
