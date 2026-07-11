"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, SquarePlus, ShoppingBag } from "lucide-react";
import { addToCartAction } from "@/lib/actions/cart";
import { Button } from "@/components/ui/button";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { cn } from "@/lib/utils/cn";
import { parseColorOption } from "@/lib/utils/color";

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
  // Which button triggered the in-flight action, so only that one spins.
  const [active, setActive] = useState<"cart" | "buy" | null>(null);
  const [qty, setQty] = useState(1);
  const [color, setColor] = useState(colors[0] ?? "");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const soldOut = stock <= 0;

  function add(which: "cart" | "buy", then?: () => void) {
    setMsg(null);
    setActive(which);
    startTransition(async () => {
      const res = await addToCartAction(productId, qty, color);
      setMsg(res.ok ? { type: "ok", text: "Added to cart" } : { type: "err", text: res.error });
      router.refresh();
      if (res.ok) then?.();
      setActive(null);
    });
  }

  return (
    <div className="space-y-4" data-testid="buy-box">
      {colors.length > 0 && (
        <div className="rounded-lg border border-hairline bg-surface p-4">
          <span className="mb-2 block text-sm font-semibold text-ink">
            Color: <span className="font-normal text-muted">{color ? parseColorOption(color).name : ""}</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => {
              const { name, swatch } = parseColorOption(c);
              return (
              <button
                key={c}
                type="button"
                data-testid="color-option"
                data-selected={c === color}
                onClick={() => setColor(c)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
                  c === color
                    ? "border-accent bg-accent/5 font-medium text-ink"
                    : "border-hairline-strong text-ink hover:border-ink",
                )}
              >
                <span
                  aria-hidden
                  className="h-3.5 w-3.5 rounded-full border border-hairline-strong"
                  style={{ backgroundColor: swatch }}
                />
                {name}
              </button>
              );
            })}
          </div>
        </div>
      )}

      {!soldOut && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-ink">Quantity:</span>
          <div className="flex items-center rounded-full border border-hairline-strong">
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
      )}

      {soldOut ? (
        <Button variant="outline" size="lg" disabled data-testid="add-to-cart" className="w-full rounded-full">
          Sold out
        </Button>
      ) : (
        /* Action bar: sticky at the viewport bottom on mobile (over the tab
           bar, like the reference site), inline in the column on lg+. */
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-surface p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
          {msg && (
            <p
              data-testid="cart-feedback"
              role="status"
              className={cn("mb-2 text-center text-xs font-medium lg:text-left", msg.type === "ok" ? "text-green-700" : "text-amber-600")}
            >
              {msg.text}
            </p>
          )}
          <div className="mx-auto grid max-w-md grid-cols-2 gap-3 lg:mx-0 lg:max-w-none">
            <Button
              type="button"
              variant="accent"
              size="lg"
              loading={active === "buy"}
              disabled={pending}
              data-testid="buy-now"
              onClick={() => add("buy", () => router.push("/cart"))}
              className="rounded-full px-4 lg:px-6"
            >
              {active !== "buy" && <ShoppingBag className="h-4 w-4 shrink-0" />}
              {active === "buy" ? "Adding…" : "Buy Now"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              loading={active === "cart"}
              disabled={pending}
              data-testid="add-to-cart"
              onClick={() => add("cart")}
              className="rounded-full px-4 lg:px-6"
            >
              {active !== "cart" &&
                (msg?.type === "ok" ? <Check className="h-4 w-4 shrink-0" /> : <SquarePlus className="h-4 w-4 shrink-0" />)}
              {active === "cart" ? "Adding…" : "Add to cart"}
            </Button>
          </div>
        </div>
      )}

      <WishlistButton productId={productId} isAuthed={isAuthed} initiallyInWishlist={initiallyInWishlist} />
    </div>
  );
}
