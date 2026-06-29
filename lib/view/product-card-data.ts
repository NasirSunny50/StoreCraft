import { formatBDT } from "@/lib/utils/money";
import type { ProductListItem } from "@/lib/queries/product";

/** Plain, serializable shape for a product card — safe to pass to Client Components. */
export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  priceFormatted: string;
  comparePriceFormatted: string | null;
  imageUrl: string | null;
  imageAlt: string;
  brandName: string | null;
  ratingAvg: number;
  ratingCount: number;
  stock: number;
  specBullets: string[];
};

export function toCardData(item: ProductListItem): ProductCardData {
  const image = item.images[0];
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    priceFormatted: formatBDT(item.price),
    comparePriceFormatted: item.comparePrice ? formatBDT(item.comparePrice) : null,
    imageUrl: image?.url ?? null,
    imageAlt: image?.alt ?? item.name,
    brandName: item.brand?.name ?? null,
    ratingAvg: item.ratingAvg,
    ratingCount: item.ratingCount,
    stock: item.stock,
    specBullets: item.specs.map((s) => `${s.key}: ${s.value}`),
  };
}
