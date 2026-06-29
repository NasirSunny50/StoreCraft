"use server";

import { revalidatePath } from "next/cache";
import {
  addToWishlist,
  removeFromWishlist,
  moveToCart,
  type WishlistWithItems,
} from "@/lib/wishlist";
import type { CartMutationResult } from "@/lib/cart";

function revalidateWishlistViews() {
  revalidatePath("/wishlist");
  revalidatePath("/cart");
  revalidatePath("/", "layout"); // header badges
}

export async function addToWishlistAction(
  productId: string,
): Promise<CartMutationResult> {
  const result = await addToWishlist(productId);
  revalidateWishlistViews();
  return result;
}

export async function removeFromWishlistAction(
  productId: string,
): Promise<CartMutationResult> {
  const result = await removeFromWishlist(productId);
  revalidateWishlistViews();
  return result;
}

export async function moveToCartAction(
  productId: string,
): Promise<CartMutationResult> {
  const result = await moveToCart(productId);
  revalidateWishlistViews();
  return result;
}

export type { WishlistWithItems };
