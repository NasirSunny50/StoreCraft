/** URL-safe slug from a name. Used for categories, brands, products. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, "") // drop punctuation (keep spaces/underscores/dashes)
    .replace(/[\s_-]+/g, "-") // collapse whitespace/underscores/dashes to single dash
    .replace(/^-+|-+$/g, ""); // trim leading/trailing dashes
}
