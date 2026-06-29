import { z } from "zod";

export const PRODUCT_SORTS = [
  "newest",
  "price-asc",
  "price-desc",
  "popularity",
] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const PRODUCTS_PER_PAGE = 8;

/**
 * Parses raw URL search params (strings) into a typed, validated product filter.
 * Invalid values are dropped (coerced to undefined) rather than throwing — a bad
 * URL should degrade to a sensible listing, not a 500.
 */
export const productFilterSchema = z.object({
  q: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => (v ? v : undefined)),
  category: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  minPrice: z.coerce.number().nonnegative().optional().catch(undefined),
  maxPrice: z.coerce.number().nonnegative().optional().catch(undefined),
  inStock: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  minRating: z.coerce.number().min(0).max(5).optional().catch(undefined),
  sort: z.enum(PRODUCT_SORTS).optional().catch("newest").default("newest"),
  cursor: z.string().trim().optional(),
});

export type ProductFilter = z.infer<typeof productFilterSchema>;

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseProductFilter(params: RawSearchParams): ProductFilter {
  const parsed = productFilterSchema.safeParse({
    q: first(params.q),
    category: first(params.category),
    brand: first(params.brand),
    minPrice: first(params.minPrice),
    maxPrice: first(params.maxPrice),
    inStock: first(params.inStock),
    minRating: first(params.minRating),
    sort: first(params.sort),
    cursor: first(params.cursor),
  });
  // Schema uses .catch on risky fields, so parse should succeed; fall back safely.
  return parsed.success
    ? parsed.data
    : { sort: "newest", inStock: false };
}
