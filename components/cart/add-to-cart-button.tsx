"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check } from "lucide-react";
import { addToCartAction } from "@/lib/actions/cart";
import { Button } from "@/components/ui/button";
import { emitCartToast } from "@/components/ui/cart-toast";

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
  const [added, setAdded] = useState(false);

  const outOfStock = stock <= 0;

  function handleAdd() {
    startTransition(async () => {
      const res = await addToCartAction(productId, qty);
      if (res.ok) {
        emitCartToast({ title: "Added to cart", subtitle: "Item added — ready when you are." });
        setAdded(true);
        setTimeout(() => setAdded(false), 1600);
      } else {
        emitCartToast({ type: "error", title: "Couldn’t add to cart", subtitle: res.error });
      }
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
        variant={added ? "navy" : "accent"}
        size={size}
        onClick={handleAdd}
        disabled={pending}
        data-testid="add-to-cart"
        className="w-full transition-colors"
      >
        {added ? (
          <Check className="h-4 w-4" style={{ animation: "check-pop 0.35s ease-out" }} />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {pending ? "Adding…" : added ? "Added!" : "Add to cart"}
      </Button>
    </div>
  );
}
