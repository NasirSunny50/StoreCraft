import Link from "next/link";
import { requireRole, ADMIN_PORTAL_ROLES } from "@/lib/auth-guard";
import { LogoutButton } from "@/components/auth/logout-button";

// Role guard for the ENTIRE admin portal. Checked server-side on every request.
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireRole(...ADMIN_PORTAL_ROLES);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-lg font-bold">
              StoreCraft Admin
            </Link>
            <Link href="/" className="text-sm text-gray-500 hover:underline">
              ← Storefront
            </Link>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span data-testid="admin-user-role">
              {session.user.name} · {session.user.role}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
