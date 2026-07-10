"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import type { Role } from "@prisma/client";
import { AdminNav } from "@/components/admin/admin-nav";
import { BrandLogo } from "@/components/brand-logo";

/**
 * Mobile-only hamburger + slide-in drawer for the admin portal, mirroring the
 * storefront's mobile menu. Replaces the desktop sidebar (which is hidden below
 * md) so admins can still navigate on phones.
 */
export function AdminMobileNav({
  role,
  shopName,
  logoUrl,
}: {
  role: Role;
  shopName: string;
  logoUrl?: string;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        data-testid="admin-menu-button"
        onClick={() => setOpen(true)}
        className="grid h-9 w-9 shrink-0 place-items-center rounded text-ink hover:bg-surface-2 md:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={close} />
          <div className="absolute left-0 top-0 flex h-full w-64 max-w-[82%] flex-col overflow-y-auto bg-navbar p-2 shadow-xl">
            <div className="mb-1 flex items-center justify-between px-2 py-2">
              <Link href="/admin" onClick={close} className="flex items-center gap-1.5">
                <BrandLogo shopName={shopName} logoUrl={logoUrl} variant="dark" className="text-lg" imgClassName="h-7" />
                <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                  Admin
                </span>
              </Link>
              <button
                type="button"
                aria-label="Close menu"
                onClick={close}
                className="grid h-8 w-8 place-items-center rounded text-white/70 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <AdminNav role={role} onNavigate={close} />
          </div>
        </div>
      )}
    </>
  );
}
