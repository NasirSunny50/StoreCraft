"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Tag, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * App-style fixed bottom tab bar, mobile only (hidden on lg+). Mirrors the
 * marketplace pattern: Home / Categories / Offers / Account.
 */
export function MobileBottomNav({ isAuthed }: { isAuthed: boolean }) {
  const pathname = usePathname();

  // Product detail pages show a sticky buy bar instead (marketplace pattern).
  if (pathname.startsWith("/products/")) return null;

  const items = [
    { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
    { href: "/categories", label: "Categories", icon: LayoutGrid, match: (p: string) => p.startsWith("/categories") || p.startsWith("/category") || p.startsWith("/products") },
    { href: "/offers", label: "Offers", icon: Tag, match: (p: string) => p.startsWith("/offers") },
    { href: isAuthed ? "/orders" : "/login", label: "Account", icon: User, match: (p: string) => p.startsWith("/orders") || p.startsWith("/account") || p.startsWith("/login") },
  ];

  return (
    <nav
      data-testid="mobile-bottom-nav"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface lg:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch">
        {items.map((it) => {
          const active = it.match(pathname);
          const Icon = it.icon;
          return (
            <Link
              key={it.label}
              href={it.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium",
                active ? "text-accent" : "text-muted",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
