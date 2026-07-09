import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { getBranding, brandTitle } from "@/lib/branding";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const b = await getBranding();
  const icon = b.faviconUrl || b.logoUrl;
  return {
    title: { default: brandTitle(b), template: `%s · ${b.shopName}` },
    description: b.metaDescription,
    ...(icon ? { icons: { icon } } : {}),
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
