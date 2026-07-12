import Link from "next/link";
import { auth } from "@/lib/auth";
import { getBranding } from "@/lib/branding";
import { SiteHeader } from "@/components/site-header";
import { BrandLogo } from "@/components/brand-logo";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { CompareProvider } from "@/components/compare/compare-context";
import { CompareBar } from "@/components/compare/compare-bar";

export default async function ShopLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [session, branding] = await Promise.all([auth(), getBranding()]);

  return (
    <CompareProvider>
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 pb-24 lg:pb-5">
        {children}
      </main>

      <CompareBar />
      <MobileBottomNav isAuthed={!!session?.user} />

      <footer className="mt-10 bg-navbar text-white/70">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
          <div>
            <div className="mb-3">
              <BrandLogo shopName={branding.shopName} logoUrl={branding.logoUrl} variant="dark" className="text-xl" imgClassName="h-8" />
            </div>
            {branding.tagline && <p className="text-xs leading-relaxed">{branding.tagline}</p>}
            {branding.hotline && <p className="mt-3 text-xs">Hotline: {branding.hotline}</p>}
            {branding.contactEmail && <p className="mt-1 text-xs">{branding.contactEmail}</p>}
            {branding.address && <p className="mt-1 text-xs leading-relaxed">{branding.address}</p>}
            {(branding.facebook || branding.instagram || branding.whatsapp) && (
              <div className="mt-3 flex gap-3 text-xs">
                {branding.facebook && <a href={branding.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-white">Facebook</a>}
                {branding.instagram && <a href={branding.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-white">Instagram</a>}
                {branding.whatsapp && <a href={branding.whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>}
              </div>
            )}
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Shop</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/products" className="hover:text-white">All Products</Link></li>
              <li><Link href="/category/laptops" className="hover:text-white">Laptops</Link></li>
              <li><Link href="/category/smartphones" className="hover:text-white">Smartphones</Link></li>
              <li><Link href="/category/audio" className="hover:text-white">Audio</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Account</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/login" className="hover:text-white">Sign In</Link></li>
              <li><Link href="/register" className="hover:text-white">Register</Link></li>
              <li><Link href="/cart" className="hover:text-white">Cart</Link></li>
              <li><Link href="/wishlist" className="hover:text-white">Wishlist</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Info</h4>
            <ul className="space-y-2 text-xs">
              <li>Cash on Delivery</li>
              <li>7-Day Replacement</li>
              <li>Authentic Products</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-white/50">
            © {new Date().getFullYear()} {branding.shopName}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
    </CompareProvider>
  );
}
