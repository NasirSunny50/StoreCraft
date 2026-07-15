import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Homepage hero banners. The hero has three placements a store owner controls
 * from the admin portal:
 *   • main       — the large rotating slider on the left (many images)
 *   • sideTop    — the small promo box, top-right (one image)
 *   • sideBottom — the small promo box, bottom-right (one image)
 *
 * Stored as a single JSON row in the Setting table (key "banners"), mirroring
 * how branding is persisted, so no schema migration is needed. When a placement
 * is empty the slider/promo falls back to its built-in design, so a fresh store
 * is never blank.
 */
export type Banner = {
  imageUrl: string;
  /** Optional click-through target (internal path or full URL). Empty = not clickable. */
  href: string;
};

export type BannerSet = {
  main: Banner[];
  sideTop: Banner | null;
  sideBottom: Banner | null;
};

export const EMPTY_BANNER_SET: BannerSet = { main: [], sideTop: null, sideBottom: null };

/** Recommended dimensions, surfaced in the admin UI; fit is enforced via object-cover. */
export const BANNER_ASPECT = "3 / 1"; // main slider — wide
export const BANNER_RECOMMENDED = "1200 × 400 px";
export const SIDE_BANNER_ASPECT = "16 / 9"; // side promo boxes
export const SIDE_BANNER_RECOMMENDED = "600 × 340 px";

const BANNERS_KEY = "banners";

/** Clean a single raw entry into a Banner, or null if it has no image. */
function normalizeBanner(b: unknown): Banner | null {
  if (!b || typeof b !== "object") return null;
  const rec = b as Record<string, unknown>;
  const imageUrl = typeof rec.imageUrl === "string" ? rec.imageUrl.trim() : "";
  if (imageUrl === "") return null;
  return { imageUrl, href: typeof rec.href === "string" ? rec.href : "" };
}

function normalizeList(v: unknown): Banner[] {
  if (!Array.isArray(v)) return [];
  return v.map(normalizeBanner).filter((b): b is Banner => b !== null);
}

/** Configured banner set. Request-cached (dedup per render). */
export const getBannerSet = cache(async (): Promise<BannerSet> => {
  try {
    const row = await prisma.setting.findUnique({ where: { key: BANNERS_KEY } });
    if (!row) return EMPTY_BANNER_SET;
    const saved = JSON.parse(row.value) as unknown;
    // Backward-compat: an older format stored a plain array of main banners.
    if (Array.isArray(saved)) {
      return { main: normalizeList(saved), sideTop: null, sideBottom: null };
    }
    const rec = (saved ?? {}) as Record<string, unknown>;
    return {
      main: normalizeList(rec.main),
      sideTop: normalizeBanner(rec.sideTop),
      sideBottom: normalizeBanner(rec.sideBottom),
    };
  } catch {
    // Never let a banner read break the homepage — fall back to none.
    return EMPTY_BANNER_SET;
  }
});

/** Persist the banner set (validated upstream). Stores the object as JSON. */
export async function setBannerSet(set: BannerSet): Promise<void> {
  const value = JSON.stringify(set);
  await prisma.setting.upsert({
    where: { key: BANNERS_KEY },
    create: { key: BANNERS_KEY, value },
    update: { value },
  });
}
