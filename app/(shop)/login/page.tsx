import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Login — StoreCraft" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

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
        <LoginForm />
      </div>
    </div>
  );
}
