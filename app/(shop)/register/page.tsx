import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
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

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="mb-4 text-center">
        <span className="text-2xl font-extrabold tracking-tight text-accent">Store</span>
        <span className="text-2xl font-extrabold tracking-tight text-ink">Craft</span>
      </div>
      <div className="rounded-lg border border-hairline bg-surface p-6">
        <h1 className="mb-5 text-center text-2xl font-bold text-ink" data-testid="register-heading">
          Create your account
        </h1>
        <RegisterForm callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
