import Link from "next/link";
import { redirect } from "next/navigation";
import { UserPlus, ShieldCheck, Truck, BadgeCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { getBranding } from "@/lib/branding";
import { RegisterForm } from "@/components/auth/register-form";
import { safeCallbackUrl } from "@/lib/utils/safe-redirect";

export const metadata = { title: "Register" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const callbackUrl = safeCallbackUrl((await searchParams).callbackUrl) ?? undefined;
  if (session?.user) redirect(callbackUrl ?? "/");

  const b = await getBranding();

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
        <div className="relative bg-[linear-gradient(120deg,#1f6fb2,#142033)] px-6 py-6 text-white">
          <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-4 h-20 w-20 rounded-full bg-white/10" />
          <span className="grid h-11 w-11 place-items-center rounded-full bg-white/15 backdrop-blur">
            <UserPlus className="h-5 w-5" />
          </span>
          <h1 className="mt-3 text-2xl font-bold" data-testid="register-heading">Create your account</h1>
          <p className="text-sm text-white/85">Join to track orders, save addresses and check out faster.</p>
        </div>

        <div className="p-6">
          <RegisterForm callbackUrl={callbackUrl} />
        </div>

        {/* Trust strip */}
        <div className="flex items-center justify-center gap-4 border-t border-hairline bg-surface-2 px-6 py-3 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1"><BadgeCheck className="h-3.5 w-3.5 text-accent" /> Genuine products</span>
          <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-accent" /> Secure</span>
          <span className="inline-flex items-center gap-1"><Truck className="h-3.5 w-3.5 text-accent" /> Fast delivery</span>
        </div>
      </div>
    </div>
  );
}
