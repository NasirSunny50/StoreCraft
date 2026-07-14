import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { auth } from "@/lib/auth";
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

  // Show the "continue as guest" option only when the user was heading to checkout.
  const fromCheckout = callbackUrl === "/checkout";

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="mb-4 text-center">
        <span className="text-2xl font-extrabold tracking-tight text-accent">Store</span>
        <span className="text-2xl font-extrabold tracking-tight text-ink">Craft</span>
      </div>
      <div className="rounded-lg border border-hairline bg-surface p-6">
        <h1 className="mb-5 text-center text-2xl font-bold text-ink" data-testid="login-heading">
          Sign in
        </h1>
        <LoginForm callbackUrl={callbackUrl} />
      </div>

      {fromCheckout && (
        <div className="mt-4 rounded-lg border border-hairline bg-surface p-4 text-center">
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
