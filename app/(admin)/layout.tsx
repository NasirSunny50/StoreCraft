import Link from "next/link";
import { requireRole, ADMIN_PORTAL_ROLES } from "@/lib/auth-guard";
import { LogoutButton } from "@/components/auth/logout-button";
import { AdminNav } from "@/components/admin/admin-nav";

// Role guard for the ENTIRE admin portal (ADMIN or STAFF). ADMIN-only sections
// guard again at the page level.
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireRole(...ADMIN_PORTAL_ROLES);

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="flex h-14 items-center justify-between border-b border-hairline bg-surface px-4">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-baseline gap-1">
            <span className="text-lg font-extrabold text-accent">Store</span>
            <span className="text-lg font-extrabold text-ink">Craft</span>
            <span className="ml-1 rounded bg-navbar px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
              Admin
            </span>
          </Link>
          <Link href="/" className="text-xs text-muted hover:text-accent">
            ← Storefront
          </Link>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span data-testid="admin-user-role" className="text-muted">
            {session.user.name} · {session.user.role}
          </span>
          <LogoutButton />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-5 p-4">
        <aside className="hidden w-52 shrink-0 self-start rounded bg-navbar p-2 md:block">
          <AdminNav role={session.user.role} />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
