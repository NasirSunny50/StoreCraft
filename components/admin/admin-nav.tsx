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
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Item = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  exact?: boolean;
};

const ITEMS: Item[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/products", label: "Products", icon: Package, adminOnly: true },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, adminOnly: true },
  { href: "/admin/brands", label: "Brands", icon: Tags, adminOnly: true },
  { href: "/admin/customers", label: "Customers", icon: Users, adminOnly: true },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket, adminOnly: true },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, adminOnly: true },
  { href: "/admin/settings", label: "Delivery Charges", icon: Settings, adminOnly: true },
];

export function AdminNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = ITEMS.filter((i) => !i.adminOnly || role === "ADMIN");

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            data-testid={`adminnav-${item.label.toLowerCase()}`}
            className={cn(
              "flex items-center gap-3 rounded px-3 py-2 text-sm",
              active
                ? "bg-accent text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
