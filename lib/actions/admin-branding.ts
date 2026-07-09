"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { setBranding, type Branding } from "@/lib/branding";
import { brandingSchema, type BrandingInput } from "@/lib/validators/branding";

/** ADMIN: update store branding. Empty optional fields fall back to defaults on read. */
export async function updateBranding(
  input: BrandingInput,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  const parsed = brandingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid branding." };
  }
  const d = parsed.data;

  const branding: Branding = {
    shopName: d.shopName,
    logoUrl: d.logoUrl ?? "",
    faviconUrl: d.faviconUrl ?? "",
    tagline: d.tagline ?? "",
    metaTitle: d.metaTitle ?? "",
    metaDescription: d.metaDescription ?? "",
    hotline: d.hotline ?? "",
    contactEmail: d.contactEmail ?? "",
    address: d.address ?? "",
    facebook: d.facebook ?? "",
    instagram: d.instagram ?? "",
    whatsapp: d.whatsapp ?? "",
  };

  try {
    await setBranding(branding);
    // Branding shows in every layout — refresh the whole tree.
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to save branding." };
  }
}
