import Link from "next/link";
import { ShoppingCart, Heart, Phone, ChevronDown } from "lucide-react";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/utils/roles";
import { getCart, cartCount } from "@/lib/cart";
import { getWishlist, wishlistCount } from "@/lib/wishlist";
import { getCategories } from "@/lib/queries/product";
import { getBranding } from "@/lib/branding";
import { LogoutButton } from "@/components/auth/logout-button";
import { MobileMenu } from "@/components/mobile-menu";
import { BrandLogo } from "@/components/brand-logo";
import { SearchAutocomplete } from "@/components/search-autocomplete";

export async function SiteHeader() {
  const [session, cart, wishlist, categories, branding] = await Promise.all([
    auth(),
    getCart(),
    getWishlist(),
    getCategories(),
    getBranding(),
  ]);
  const user = session?.user;
  const cartQty = cartCount(cart);
  const wishQty = wishlistCount(wishlist);

  return (
    <header className="sticky top-0 z-40">
      {/* Top utility bar */}
      <div className="bg-navbar text-white">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-xs">
          <span className="hidden truncate text-white/70 sm:inline">Tech for everyone — fast delivery across Bangladesh</span>
          <div className="ml-auto flex items-center gap-4">
            {branding.hotline && (
              <span className="hidden items-center gap-1 text-white/70 sm:flex">
                <Phone className="h-3.5 w-3.5" /> Hotline {branding.hotline}
              </span>
            )}
            <Link href="/track" className="hidden text-white/80 hover:text-white sm:inline">
              Track Order
            </Link>
            {user ? (
              <>
              <Link href="/orders" data-testid="nav-orders" className="text-white/80 hover:text-white">
                My Orders
              </Link>
              <Link href="/account/addresses" className="hidden text-white/80 hover:text-white sm:inline">
                Addresses
              </Link>
              <span className="flex items-center gap-2" data-testid="user-greeting">
                <Link href="/account/profile" data-testid="nav-profile" className="hidden text-white/80 hover:text-white sm:inline">
                  Hi, {user.name}
                </Link>
                <span data-testid="user-role" className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold">
                  {user.role}
                </span>
                {hasRole(user.role, "ADMIN", "STAFF") && (
                  <Link href="/admin" data-testid="nav-admin" className="font-medium text-white hover:underline">
                    Admin
                  </Link>
                )}
                <LogoutButton />
              </span>
              </>
            ) : (
              <span className="flex items-center gap-3">
                <Link href="/login" data-testid="nav-login" className="text-white/80 hover:text-white">
                  Sign In
                </Link>
                <Link href="/register" data-testid="nav-register" className="font-medium text-white hover:underline">
                  Register
                </Link>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main header: logo + search + cart */}
      <div className="border-b border-hairline bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center gap-3">
          <MobileMenu
            categories={categories}
            isAuthed={!!user}
            isStaff={!!user && hasRole(user.role, "ADMIN", "STAFF")}
            shopName={branding.shopName}
            logoUrl={branding.logoUrl}
          />
          <Link href="/" className="flex shrink-0 items-center">
            <BrandLogo
              shopName={branding.shopName}
              logoUrl={branding.logoUrl}
              variant="light"
              className="text-xl sm:text-2xl"
            />
          </Link>

          <SearchAutocomplete categories={categories} />

          <div className="ml-auto flex items-center gap-5">
            {user && (
              <Link href="/wishlist" data-testid="nav-wishlist" className="relative flex items-center gap-2 text-ink hover:text-accent">
                <span className="relative">
                  <Heart className="h-6 w-6" strokeWidth={1.5} />
                  {wishQty > 0 && (
                    <span data-testid="wishlist-badge" className="absolute -right-2 -top-2 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] font-bold leading-4 text-white">
                      {wishQty}
                    </span>
                  )}
                </span>
                <span className="hidden text-xs lg:inline">Wishlist</span>
              </Link>
            )}
            <Link href="/cart" data-testid="nav-cart" className="relative flex items-center gap-2 text-ink hover:text-accent">
              <span className="relative">
                <ShoppingCart className="h-6 w-6" strokeWidth={1.5} />
                {cartQty > 0 && (
                  <span data-testid="cart-badge" className="absolute -right-2 -top-2 min-w-4 rounded-full bg-accent px-1 text-center text-[10px] font-bold leading-4 text-white">
                    {cartQty}
                  </span>
                )}
              </span>
              <span className="hidden text-xs lg:inline">Cart</span>
            </Link>
          </div>
          </div>

          {/* Mobile full-width search row */}
          <SearchAutocomplete variant="mobile" />
        </div>
      </div>

      {/* Category navigation bar (desktop only — mobile uses the hamburger menu) */}
      <nav className="hidden bg-navbar-2 text-white lg:block">
        <div className="mx-auto flex max-w-7xl items-center px-4">
          <div className="group relative">
            <button className="flex h-11 items-center gap-2 bg-accent px-4 text-sm font-semibold">
              All Categories
              <ChevronDown className="h-4 w-4" />
            </button>
            <div className="invisible absolute left-0 top-full z-50 w-60 border border-hairline bg-surface text-ink opacity-0 shadow-card-hover transition-all group-hover:visible group-hover:opacity-100">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  className="block border-b border-hairline px-4 py-2.5 text-sm hover:bg-surface-2 hover:text-accent"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto px-2">
            <Link href="/products" data-testid="nav-products" className="px-3 py-3 text-sm font-medium text-white/90 hover:text-white">
              All Products
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="whitespace-nowrap px-3 py-3 text-sm text-white/80 hover:text-white"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}
