import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * White-label store branding. Everything a shop owner customises for their
 * copy of the store — name, logo, contact, SEO — lives here, backed by a single
 * JSON row in the Setting table (key "branding"). Read via getBranding() which
 * is request-cached; written via setBranding() from the admin portal.
 *
 * This is what makes the product resellable: no brand string is hardcoded in
 * the UI — it all flows from these values (with sensible defaults when unset).
 */
export type Branding = {
  shopName: string;
  logoUrl: string;
  faviconUrl: string;
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  hotline: string;
  contactEmail: string;
  address: string;
  facebook: string;
  instagram: string;
  whatsapp: string;
};

export const DEFAULT_BRANDING: Branding = {
  shopName: "StoreCraft",
  logoUrl: "",
  faviconUrl: "",
  tagline: "Your trusted electronics shop",
  metaTitle: "",
  metaDescription:
    "Genuine products, fast delivery, cash on delivery available.",
  hotline: "16793",
  contactEmail: "",
  address: "",
  facebook: "",
  instagram: "",
  whatsapp: "",
};

const BRANDING_KEY = "branding";

/** Current store branding, merged over defaults. Request-cached (dedup per render). */
export const getBranding = cache(async (): Promise<Branding> => {
  try {
    const row = await prisma.setting.findUnique({ where: { key: BRANDING_KEY } });
    if (!row) return DEFAULT_BRANDING;
    const saved = JSON.parse(row.value) as Partial<Branding>;
    return { ...DEFAULT_BRANDING, ...saved };
  } catch {
    // Never let a branding read break a page — fall back to defaults.
    return DEFAULT_BRANDING;
  }
});

/** Persist branding (validated upstream). Stores the full object as JSON. */
export async function setBranding(branding: Branding): Promise<void> {
  const value = JSON.stringify(branding);
  await prisma.setting.upsert({
    where: { key: BRANDING_KEY },
    create: { key: BRANDING_KEY, value },
    update: { value },
  });
}

/** Effective page title for metadata: explicit metaTitle, else "Shop — tagline". */
export function brandTitle(b: Branding): string {
  if (b.metaTitle.trim()) return b.metaTitle.trim();
  return b.tagline.trim() ? `${b.shopName} — ${b.tagline}` : b.shopName;
}
