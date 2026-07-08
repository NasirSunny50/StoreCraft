"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronRight } from "lucide-react";

type Cat = { id: string; name: string; slug: string };

/**
 * Mobile-only hamburger + slide-in drawer holding category and account links.
 * Replaces the horizontal category nav on small screens.
 */
export function MobileMenu({
  categories,
  isAuthed,
  isStaff,
}: {
  categories: Cat[];
  isAuthed: boolean;
  isStaff: boolean;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        data-testid="mobile-menu-button"
        onClick={() => setOpen(true)}
        className="grid h-9 w-9 shrink-0 place-items-center rounded text-ink lg:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={close} />
          <div className="absolute left-0 top-0 flex h-full w-72 max-w-[82%] flex-col overflow-y-auto bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
              <span className="flex items-baseline gap-1">
                <span className="text-lg font-extrabold text-accent">Store</span>
                <span className="text-lg font-extrabold text-ink">Craft</span>
              </span>
              <button type="button" aria-label="Close menu" onClick={close} className="grid h-8 w-8 place-items-center rounded text-muted hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 py-2">
              <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Shop</p>
              <Link href="/products" onClick={close} className="flex items-center justify-between px-4 py-2.5 text-sm text-ink hover:bg-surface-2 hover:text-accent">
                All Products <ChevronRight className="h-4 w-4 text-muted" />
              </Link>
              {categories.map((c) => (
                <Link key={c.id} href={`/category/${c.slug}`} onClick={close} className="flex items-center justify-between px-4 py-2.5 text-sm text-ink hover:bg-surface-2 hover:text-accent">
                  {c.name} <ChevronRight className="h-4 w-4 text-muted" />
                </Link>
              ))}

              <Link href="/track" onClick={close} className="flex items-center justify-between px-4 py-2.5 text-sm text-ink hover:bg-surface-2 hover:text-accent">
                Track Order <ChevronRight className="h-4 w-4 text-muted" />
              </Link>

              <p className="px-4 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-muted">Account</p>
              {isAuthed ? (
                <>
                  <Link href="/orders" onClick={close} className="block px-4 py-2.5 text-sm text-ink hover:bg-surface-2 hover:text-accent">My Orders</Link>
                  <Link href="/wishlist" onClick={close} className="block px-4 py-2.5 text-sm text-ink hover:bg-surface-2 hover:text-accent">Wishlist</Link>
                  <Link href="/account/addresses" onClick={close} className="block px-4 py-2.5 text-sm text-ink hover:bg-surface-2 hover:text-accent">Addresses</Link>
                  {isStaff && (
                    <Link href="/admin" onClick={close} className="block px-4 py-2.5 text-sm font-medium text-accent hover:bg-surface-2">Admin Portal</Link>
                  )}
                </>
              ) : (
                <>
                  <Link href="/login" onClick={close} className="block px-4 py-2.5 text-sm text-ink hover:bg-surface-2 hover:text-accent">Sign In</Link>
                  <Link href="/register" onClick={close} className="block px-4 py-2.5 text-sm font-medium text-accent hover:bg-surface-2">Register</Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
