import { z } from "zod";

// href may be an internal path ("/category/audio") or a full URL — allow both,
// or empty (not clickable). imageUrl is required (a banner without an image is
// pointless) and is a URL/path produced by the upload endpoint.
const linkTarget = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v), {
    message: "Link must start with / or http(s)://",
  });

export const bannerSchema = z.object({
  imageUrl: z.string().trim().min(1, "Image is required").max(500),
  href: linkTarget.default(""),
});

export const bannerSetSchema = z.object({
  main: z.array(bannerSchema).max(12, "At most 12 banners"),
  sideTop: bannerSchema.nullable(),
  sideBottom: bannerSchema.nullable(),
});

export type BannerInput = z.infer<typeof bannerSchema>;
export type BannerSetInput = z.infer<typeof bannerSetSchema>;
