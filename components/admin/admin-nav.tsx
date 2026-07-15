"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import {
  LayoutDashboard,
  ShoppingBag,
  Boxes,
  Package,
  FolderTree,
  Tags,
  Users,
  Ticket,
  BarChart3,
  Truck,
  Palette,
  Images,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  exact?: boolean;
};

type Group = { label: string; items: Item[] };

// Grouped so the sidebar reads like a proper admin menu, not a flat list.
const GROUPS: Group[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
      { href: "/admin/inventory", label: "Inventory", icon: Boxes },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: Package, adminOnly: true },
      { href: "/admin/categories", label: "Categories", icon: FolderTree, adminOnly: true },
      { href: "/admin/brands", label: "Brands", icon: Tags, adminOnly: true },
    ],
  },
  {
    label: "Customers",
    items: [
      { href: "/admin/customers", label: "Customers", icon: Users, adminOnly: true },
      { href: "/admin/coupons", label: "Coupons", icon: Ticket, adminOnly: true },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/admin/reports", label: "Reports", icon: BarChart3, adminOnly: true },
      { href: "/admin/settings", label: "Delivery Charges", icon: Truck, adminOnly: true },
      { href: "/admin/branding", label: "Store Branding", icon: Palette, adminOnly: true },
      { href: "/admin/banners", label: "Homepage Banners", icon: Images, adminOnly: true },
    ],
  },
];

export function AdminNav({
  role,
  onNavigate,
}: {
  role: Role;
  /** Called when a link is tapped — used to close the mobile drawer. */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const groups = GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.adminOnly || role === "ADMIN"),
  })).filter((g) => g.items.length > 0);

  return (
    <nav className="space-y-4">
      {groups.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="px-3 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">
            {group.label}
          </p>
          {group.items.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                data-testid={`adminnav-${item.label.toLowerCase()}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-accent font-medium text-white shadow-sm"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
