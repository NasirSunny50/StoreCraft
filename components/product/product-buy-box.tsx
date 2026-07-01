"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check } from "lucide-react";
import { addToCartAction } from "@/lib/actions/cart";
import { Button } from "@/components/ui/button";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { cn } from "@/lib/utils/cn";

export function ProductBuyBox({
  productId,
  stock,
  colors,
  isAuthed,
  initiallyInWishlist,
}: {
  productId: string;
  stock: number;
  colors: string[];
  isAuthed: boolean;
  initiallyInWishlist: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [qty, setQty] = useState(1);
  const [color, setColor] = useState(colors[0] ?? "");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const soldOut = stock <= 0;

  function add(then?: () => void) {
    setMsg(null);
    startTransition(async () => {
      const res = await addToCartAction(productId, qty, color);
      setMsg(res.ok ? { type: "ok", text: "Added to cart" } : { type: "err", text: res.error });
      router.refresh();
      if (res.ok) then?.();
    });
  }

  return (
    <div className="space-y-3" data-testid="buy-box">
      {colors.length > 0 && (
        <div>
          <span className="mb-1 block text-xs font-medium text-muted">
            Color: <span className="text-ink">{color}</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                data-testid="color-option"
                data-selected={c === color}
                onClick={() => setColor(c)}
                className={cn(
                  "rounded border px-3 py-1.5 text-sm",
                  c === color ? "border-accent bg-accent/5 text-ink" : "border-hairline-strong hover:border-ink",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {soldOut ? (
        <Button variant="outline" size="lg" disabled data-testid="add-to-cart" className="w-full">
          Sold out
        </Button>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted">Qty</span>
            <div className="flex items-center rounded border border-hairline-strong">
              <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-9 w-9 text-lg text-muted hover:text-ink">−</button>
              <input
                type="number"
                min={1}
                max={stock}
                value={qty}
                data-testid="qty-input"
                onChange={(e) => setQty(Math.max(1, Math.min(stock, Number(e.target.value) || 1)))}
                className="w-12 border-x border-hairline-strong py-1.5 text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => Math.min(stock, q + 1))} className="h-9 w-9 text-lg text-muted hover:text-ink">+</button>
            </div>
            <span className="text-xs text-muted" data-testid="stock-left">{stock} in stock</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="accent" size="lg" loading={pending} data-testid="add-to-cart" onClick={() => add()}>
              {!pending && (msg?.type === "ok" ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />)}
              {pending ? "Adding…" : "Add to cart"}
            </Button>
            <Button type="button" variant="navy" size="lg" loading={pending} data-testid="buy-now" onClick={() => add(() => router.push("/cart"))}>
              {pending ? "Adding…" : "Buy Now"}
            </Button>
          </div>
          {msg && (
            <p data-testid="cart-feedback" role="status" className={cn("text-xs", msg.type === "ok" ? "text-accent" : "text-amber-600")}>
              {msg.text}
            </p>
          )}
        </>
      )}

      <WishlistButton productId={productId} isAuthed={isAuthed} initiallyInWishlist={initiallyInWishlist} />
    </div>
  );
}
