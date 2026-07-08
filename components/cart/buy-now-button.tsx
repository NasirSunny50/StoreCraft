"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { addToCartAction } from "@/lib/actions/cart";
import { Button } from "@/components/ui/button";

/** Adds one unit, then sends the shopper to the cart (checkout arrives Phase 3). */
export function BuyNowButton({
  productId,
  stock,
  size = "default",
  className,
}: {
  productId: string;
  stock: number;
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (stock <= 0) return null;

  function buy() {
    startTransition(async () => {
      await addToCartAction(productId, 1);
      router.push("/cart");
    });
  }

  return (
    <Button
      type="button"
      variant="navy"
      size={size}
      onClick={buy}
      disabled={pending}
      data-testid="buy-now"
      className={className}
    >
      {!pending && <ShoppingBag className="h-4 w-4 shrink-0" />}
      {pending ? "…" : "Buy Now"}
    </Button>
  );
}
