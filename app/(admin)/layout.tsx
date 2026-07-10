import Link from "next/link";
import { requireRole, ADMIN_PORTAL_ROLES } from "@/lib/auth-guard";
import { getBranding } from "@/lib/branding";
import { LogoutButton } from "@/components/auth/logout-button";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { BrandLogo } from "@/components/brand-logo";

// Role guard for the ENTIRE admin portal (ADMIN or STAFF). ADMIN-only sections
// guard again at the page level.
export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireRole(...ADMIN_PORTAL_ROLES);
  const branding = await getBranding();

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {/* Top utility strip — mirrors the storefront's dark bar */}
      <div className="bg-navbar text-white">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-xs">
          <span className="hidden truncate text-white/60 sm:inline">
            Store management panel
          </span>
          <div className="ml-auto flex items-center gap-4">
            <Link href="/" className="text-white/80 hover:text-white">
              View storefront ↗
            </Link>
            <span data-testid="admin-user-role" className="hidden truncate text-white/70 sm:inline">
              {session.user.name} · {session.user.role}
            </span>
            <LogoutButton />
          </div>
        </div>
      </div>

      {/* Main header — white, like the storefront */}
      <header className="sticky top-0 z-40 border-b border-hairline bg-surface">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <AdminMobileNav role={session.user.role} shopName={branding.shopName} logoUrl={branding.logoUrl} />
          <Link href="/admin" className="flex items-center gap-1.5">
            <BrandLogo shopName={branding.shopName} logoUrl={branding.logoUrl} variant="light" className="text-lg sm:text-xl" imgClassName="h-7" />
            <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
              Admin
            </span>
          </Link>
          <span className="ml-1 hidden text-xs text-muted sm:inline">Store Management</span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-5 p-4">
        <aside className="hidden w-52 shrink-0 self-start rounded-lg bg-navbar p-3 shadow-sm md:block">
          <AdminNav role={session.user.role} />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {/* Rich footer — mirrors the storefront footer */}
      <footer className="mt-10 bg-navbar text-white/70">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-10 md:grid-cols-4">
          <div>
            <div className="mb-3">
              <BrandLogo shopName={branding.shopName} logoUrl={branding.logoUrl} variant="dark" className="text-lg" imgClassName="h-7" />
            </div>
            <p className="text-xs leading-relaxed text-white/60">
              Admin panel — manage products, orders and your store settings.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Manage</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/admin" className="hover:text-white">Dashboard</Link></li>
              <li><Link href="/admin/orders" className="hover:text-white">Orders</Link></li>
              <li><Link href="/admin/inventory" className="hover:text-white">Inventory</Link></li>
              {session.user.role === "ADMIN" && (
                <li><Link href="/admin/products" className="hover:text-white">Products</Link></li>
              )}
            </ul>
          </div>
          {session.user.role === "ADMIN" && (
            <div>
              <h4 className="mb-3 text-sm font-semibold text-white">Settings</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/admin/reports" className="hover:text-white">Reports</Link></li>
                <li><Link href="/admin/settings" className="hover:text-white">Delivery Charges</Link></li>
                <li><Link href="/admin/branding" className="hover:text-white">Store Branding</Link></li>
              </ul>
            </div>
          )}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Storefront</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/" className="hover:text-white">View storefront</Link></li>
              <li><Link href="/products" className="hover:text-white">All Products</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-white/50" data-testid="admin-footer">
            © {new Date().getFullYear()} {branding.shopName} Admin · All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
