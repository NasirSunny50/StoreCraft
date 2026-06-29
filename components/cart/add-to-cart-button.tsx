"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check } from "lucide-react";
import { addToCartAction } from "@/lib/actions/cart";
import { Button } from "@/components/ui/button";

export function AddToCartButton({
  productId,
  stock,
  withQuantity = false,
  size = "default",
}: {
  productId: string;
  stock: number;
  withQuantity?: boolean;
  size?: "sm" | "default" | "lg";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const outOfStock = stock <= 0;

  function handleAdd() {
    setMsg(null);
    startTransition(async () => {
      const res = await addToCartAction(productId, qty);
      setMsg(
        res.ok
          ? { type: "ok", text: "Added to cart" }
          : { type: "err", text: res.error },
      );
      router.refresh();
    });
  }

  if (outOfStock) {
    return (
      <Button
        variant="outline"
        size={size}
        disabled
        data-testid="add-to-cart"
        className="w-full"
      >
        Sold out
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      {withQuantity && (
        <div className="flex items-center gap-3">
          <span className="mono-label">Qty</span>
          <div className="flex items-center rounded-lg border border-hairline-strong">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="h-9 w-9 text-lg text-muted hover:text-ink"
            >
              −
            </button>
            <input
              id={`qty-${productId}`}
              type="number"
              min={1}
              max={stock}
              value={qty}
              data-testid="qty-input"
              onChange={(e) =>
                setQty(Math.max(1, Math.min(stock, Number(e.target.value) || 1)))
              }
              className="w-10 border-x border-hairline-strong bg-transparent py-1.5 text-center font-mono text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQty((q) => Math.min(stock, q + 1))}
              className="h-9 w-9 text-lg text-muted hover:text-ink"
            >
              +
            </button>
          </div>
          <span className="mono-label" data-testid="stock-left">
            {stock} in stock
          </span>
        </div>
      )}
      <Button
        type="button"
        variant="accent"
        size={size}
        onClick={handleAdd}
        disabled={pending}
        data-testid="add-to-cart"
        className="w-full"
      >
        {msg?.type === "ok" ? (
          <Check className="h-4 w-4" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {pending ? "Adding…" : "Add to cart"}
      </Button>
      {msg && (
        <p
          data-testid="cart-feedback"
          role="status"
          className={`font-mono text-xs ${
            msg.type === "ok" ? "text-accent" : "text-amber-600"
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}
