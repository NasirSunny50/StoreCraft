"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-guard";
import { setBannerSet, type BannerSet } from "@/lib/banners";
import { bannerSetSchema } from "@/lib/validators/banner";

/** ADMIN: replace the homepage banner set (main slider + two side promos). */
export async function updateBanners(
  set: BannerSet,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  const parsed = bannerSetSchema.safeParse(set);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid banners." };
  }

  try {
    await setBannerSet(parsed.data);
    // Banners show on the homepage — refresh it.
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to save banners." };
  }
}
