"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import { addToWishlistAction } from "@/lib/actions/wishlist";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function WishlistButton({
  productId,
  isAuthed,
  initiallyInWishlist = false,
}: {
  productId: string;
  isAuthed: boolean;
  initiallyInWishlist?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [inWishlist, setInWishlist] = useState(initiallyInWishlist);

  if (!isAuthed) {
    return (
      <Link
        href="/login"
        data-testid="wishlist-button"
        className={cn(buttonVariants({ variant: "outline" }), "w-full")}
      >
        <Heart className="h-4 w-4" strokeWidth={1.5} />
        Log in to save
      </Link>
    );
  }

  function add() {
    startTransition(async () => {
      const res = await addToWishlistAction(productId);
      if (res.ok) setInWishlist(true);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={add}
      disabled={pending || inWishlist}
      data-testid="wishlist-button"
      className="w-full"
    >
      <Heart
        className="h-4 w-4"
        strokeWidth={1.5}
        fill={inWishlist ? "currentColor" : "none"}
      />
      {inWishlist ? "Saved to wishlist" : pending ? "Saving…" : "Add to wishlist"}
    </Button>
  );
}
