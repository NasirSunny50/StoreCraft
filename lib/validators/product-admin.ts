import { z } from "zod";

const emptyToUndef = (v: unknown) => (v === "" || v == null ? undefined : v);

export const specSchema = z.object({
  key: z.string().trim().min(1).max(60),
  value: z.string().trim().min(1).max(200),
});

/**
 * An image reference: an absolute http(s) URL (Cloudinary, in production) or a
 * site-relative path like "/uploads/foo.png" (the local-disk upload fallback
 * used in dev when Cloudinary isn't configured).
 */
const imageRef = z
  .string()
  .trim()
  .refine(
    (v) => /^https?:\/\//i.test(v) || v.startsWith("/"),
    "Image must be a valid URL or path",
  );

export const productFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(200),
  slug: z.preprocess(emptyToUndef, z.string().trim().max(220).optional()),
  description: z.string().trim().min(1, "Description is required").max(5000),
  price: z.coerce.number().positive("Price must be greater than 0"),
  comparePrice: z.preprocess(
    emptyToUndef,
    z.coerce.number().positive("Compare price must be greater than 0").optional(),
  ),
  // Buying/cost price — used for profit reports. Optional; defaults to 0.
  costPrice: z.preprocess(
    emptyToUndef,
    z.coerce.number().min(0, "Cost price cannot be negative").optional(),
  ),
  stock: z.coerce.number().int("Stock must be a whole number").min(0),
  lowStockAt: z.preprocess(
    emptyToUndef,
    z.coerce.number().int().min(0).default(5),
  ),
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.preprocess(emptyToUndef, z.string().optional()),
  isActive: z.coerce.boolean().default(true),
  isFeatured: z.coerce.boolean().default(false),
  warranty: z.preprocess(emptyToUndef, z.string().trim().max(120).optional()),
  colors: z.array(z.string().trim().min(1).max(60)).default([]),
  specs: z.array(specSchema).default([]),
  images: z.array(imageRef).default([]),
}).refine(
  // comparePrice is the struck "regular" price — it must exceed the sale price.
  (d) => d.comparePrice === undefined || d.comparePrice > d.price,
  { message: "Regular price must be higher than the sale price", path: ["comparePrice"] },
);

export type ProductFormInput = z.infer<typeof productFormSchema>;

/** One CSV import row. Category/brand are resolved by name in the action. */
export const csvProductRowSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().min(1),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0),
  category: z.string().trim().min(1),
  brand: z.preprocess(emptyToUndef, z.string().trim().optional()),
  comparePrice: z.preprocess(emptyToUndef, z.coerce.number().positive().optional()),
});
