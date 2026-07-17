import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingBag, LogIn, ShieldCheck, Truck } from "lucide-react";
import { auth } from "@/lib/auth";
import { getBranding } from "@/lib/branding";
import { LoginForm } from "@/components/auth/login-form";
import { safeCallbackUrl } from "@/lib/utils/safe-redirect";

export const metadata = { title: "Login" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const callbackUrl = safeCallbackUrl((await searchParams).callbackUrl) ?? undefined;
  if (session?.user) redirect(callbackUrl ?? "/");

  const b = await getBranding();
  // Show the "continue as guest" option only when the user was heading to checkout.
  const fromCheckout = callbackUrl === "/checkout";

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center py-8 sm:py-12">
      <div className="mb-5 text-center">
        <Link href="/" className="inline-flex items-center text-2xl font-extrabold tracking-tight">
          <span className="text-accent">{b.shopName}</span>
        </Link>
        {b.tagline && <p className="mt-1 text-xs text-muted">{b.tagline}</p>}
      </div>

      <div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-card-hover">
        {/* Accent header */}
        <div className="relative bg-[linear-gradient(120deg,#e74c3c,#cf3f2f)] px-6 py-6 text-white">
          <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-4 h-20 w-20 rounded-full bg-white/10" />
          <span className="grid h-11 w-11 place-items-center rounded-full bg-white/15 backdrop-blur">
            <LogIn className="h-5 w-5" />
          </span>
          <h1 className="mt-3 text-2xl font-bold" data-testid="login-heading">Welcome back</h1>
          <p className="text-sm text-white/85">Sign in to track orders and check out faster.</p>
        </div>

        <div className="p-6">
          <LoginForm callbackUrl={callbackUrl} />
        </div>

        {/* Trust strip */}
        <div className="flex items-center justify-center gap-5 border-t border-hairline bg-surface-2 px-6 py-3 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-accent" /> Secure sign-in</span>
          <span className="inline-flex items-center gap-1"><Truck className="h-3.5 w-3.5 text-accent" /> Fast delivery</span>
        </div>
      </div>

      {fromCheckout && (
        <div className="mt-4 rounded-2xl border border-hairline bg-surface p-4 text-center">
          <p className="text-sm font-medium text-ink">Don&apos;t want to sign in?</p>
          <p className="mt-0.5 text-xs text-muted">
            You can place your order as a guest — no account needed.
          </p>
          <Link
            href="/checkout?guest=1"
            data-testid="continue-as-guest"
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-hairline-strong px-5 py-2 text-sm font-semibold text-ink hover:border-accent hover:text-accent"
          >
            <ShoppingBag className="h-4 w-4" /> Continue as guest
          </Link>
        </div>
      )}
    </div>
  );
}
