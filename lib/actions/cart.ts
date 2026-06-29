"use server";

import { revalidatePath } from "next/cache";
import {
  addToCart,
  updateCartItem,
  removeCartItem,
  type CartMutationResult,
} from "@/lib/cart";

function revalidateCartViews() {
  revalidatePath("/cart");
  revalidatePath("/", "layout"); // header cart badge
}

export async function addToCartAction(
  productId: string,
  qty = 1,
): Promise<CartMutationResult> {
  const result = await addToCart(productId, qty);
  revalidateCartViews();
  return result;
}

export async function updateCartItemAction(
  productId: string,
  qty: number,
): Promise<CartMutationResult> {
  const result = await updateCartItem(productId, qty);
  revalidateCartViews();
  return result;
}

export async function removeCartItemAction(
  productId: string,
): Promise<CartMutationResult> {
  const result = await removeCartItem(productId);
  revalidateCartViews();
  return result;
}
