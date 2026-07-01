import { Loader2 } from "lucide-react";

/**
 * Fallback loading UI for any shop route without its own loading.tsx
 * (cart, checkout, orders, category, home). Gives instant feedback on
 * navigation instead of a blank pause during a cold-start fetch.
 */
export default function ShopLoading() {
  return (
    <div
      className="flex min-h-[40vh] items-center justify-center"
      role="status"
      aria-label="Loading"
    >
      <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
