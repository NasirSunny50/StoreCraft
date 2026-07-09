import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .url("Enter a valid URL (https://…)")
  .optional()
  .or(z.literal(""));

/** Admin-editable store branding. Text fields trimmed; links must be valid URLs. */
export const brandingSchema = z.object({
  shopName: z.string().trim().min(1, "Shop name is required").max(60),
  logoUrl: optionalUrl,
  faviconUrl: optionalUrl,
  tagline: z.string().trim().max(120).optional().or(z.literal("")),
  metaTitle: z.string().trim().max(120).optional().or(z.literal("")),
  metaDescription: z.string().trim().max(300).optional().or(z.literal("")),
  hotline: z.string().trim().max(40).optional().or(z.literal("")),
  contactEmail: z
    .string()
    .trim()
    .max(120)
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  facebook: optionalUrl,
  instagram: optionalUrl,
  whatsapp: optionalUrl,
});

export type BrandingInput = z.infer<typeof brandingSchema>;
