"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { addToWishlistAction } from "@/lib/actions/wishlist";

/** Compact heart icon for product cards. Sends guests to /login. */
export function CardWishlistButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggle() {
    startTransition(async () => {
      const res = await addToWishlistAction(productId);
      if (!res.ok && res.error.toLowerCase().includes("log in")) {
        router.push("/login");
        return;
      }
      if (res.ok) setSaved(true);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label="Add to wishlist"
      data-testid="card-wishlist"
      className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full border border-hairline bg-white/90 text-muted shadow-card hover:text-accent disabled:opacity-50"
    >
      <Heart className="h-4 w-4" strokeWidth={1.5} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
