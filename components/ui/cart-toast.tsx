"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ToastType = "success" | "error";
type ToastData = { id: number; type: ToastType; title: string; subtitle?: string };

const EVENT = "cart:toast";

/** Fire a cart toast from anywhere (add-to-cart buttons, buy box, etc.). */
export function emitCartToast(t: { type?: ToastType; title: string; subtitle?: string }) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { type: "success", ...t } }));
}

/**
 * Global toast host — mounted once in the shop layout. Shows a single, animated
 * confirmation toast (with a "View Cart" shortcut) when an item is added, giving
 * satisfying feedback instead of a flat line of text.
 */
export function CartToaster() {
  const [toast, setToast] = useState<ToastData | null>(null);

  useEffect(() => {
    let counter = 0;
    let hideTimer: ReturnType<typeof setTimeout>;
    function onToast(e: Event) {
      const detail = (e as CustomEvent).detail as Omit<ToastData, "id">;
      const id = ++counter;
      setToast({ id, ...detail });
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setToast((cur) => (cur?.id === id ? null : cur)), 3400);
    }
    window.addEventListener(EVENT, onToast);
    return () => {
      window.removeEventListener(EVENT, onToast);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!toast) return null;
  const success = toast.type === "success";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex justify-center px-4 lg:bottom-6 lg:justify-end">
      <div
        key={toast.id}
        data-testid={success ? "cart-feedback" : "cart-toast-error"}
        role="status"
        aria-live="polite"
        style={{ animation: "toast-in 0.3s cubic-bezier(0.2,0.9,0.3,1.25)" }}
        className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-hairline bg-surface px-4 py-3 shadow-card-hover"
      >
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-full",
            success ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600",
          )}
        >
          {success ? (
            <Check className="h-5 w-5" strokeWidth={3} style={{ animation: "check-pop 0.35s ease-out" }} />
          ) : (
            <X className="h-5 w-5" strokeWidth={2.5} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-ink">{toast.title}</div>
          {toast.subtitle && <div className="truncate text-xs text-muted">{toast.subtitle}</div>}
        </div>
        {success && (
          <Link
            href="/cart"
            className="shrink-0 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-accent-strong"
          >
            View Cart
          </Link>
        )}
      </div>
    </div>
  );
}
