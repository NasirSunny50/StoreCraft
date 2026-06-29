import { ProductListing } from "@/components/product/product-listing";
import { parseProductFilter } from "@/lib/validators/product";

export const metadata = { title: "Products — StoreCraft" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filter = parseProductFilter(await searchParams);
  return <ProductListing filter={filter} heading="All Products" />;
}
