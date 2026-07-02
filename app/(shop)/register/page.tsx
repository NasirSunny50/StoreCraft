import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata = { title: "Register — StoreCraft" };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/");

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
        <RegisterForm />
      </div>
    </div>
  );
}
