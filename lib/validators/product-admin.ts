import { z } from "zod";

const emptyToUndef = (v: unknown) => (v === "" || v == null ? undefined : v);

export const specSchema = z.object({
  key: z.string().trim().min(1).max(60),
  value: z.string().trim().min(1).max(200),
});

export const productFormSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(200),
  slug: z.preprocess(emptyToUndef, z.string().trim().max(220).optional()),
  description: z.string().trim().min(1, "Description is required").max(5000),
  price: z.coerce.number().positive("Price must be greater than 0"),
  comparePrice: z.preprocess(
    emptyToUndef,
    z.coerce.number().positive("Compare price must be greater than 0").optional(),
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
  specs: z.array(specSchema).default([]),
  images: z.array(z.string().trim().url("Image must be a valid URL")).default([]),
});

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
