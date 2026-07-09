import Link from "next/link";
import { requireRole, ADMIN_PORTAL_ROLES } from "@/lib/auth-guard";
import { LogoutButton } from "@/components/auth/logout-button";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";

// Role guard for the ENTIRE admin portal (ADMIN or STAFF). ADMIN-only sections
// guard again at the page level.
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireRole(...ADMIN_PORTAL_ROLES);

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="flex h-14 items-center justify-between gap-2 bg-navbar px-3 text-white sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <AdminMobileNav role={session.user.role} />
          <Link href="/admin" className="flex items-baseline gap-1">
            <span className="text-lg font-extrabold text-accent">Store</span>
            <span className="text-lg font-extrabold text-white">Craft</span>
            <span className="ml-1 rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
              Admin
            </span>
          </Link>
          <Link href="/" className="hidden text-xs text-white/60 hover:text-white sm:inline">
            ← Back to storefront
          </Link>
        </div>
        <div className="flex min-w-0 items-center gap-2 text-sm sm:gap-3">
          <span data-testid="admin-user-role" className="hidden truncate text-white/70 sm:inline">
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

      <footer className="border-t border-white/10 bg-navbar text-white/60">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 text-center text-xs" data-testid="admin-footer">
          © {new Date().getFullYear()} StoreCraft Admin · All rights reserved.
        </div>
      </footer>
    </div>
  );
}
