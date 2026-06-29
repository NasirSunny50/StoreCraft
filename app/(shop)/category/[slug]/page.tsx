import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductListing } from "@/components/product/product-listing";
import { parseProductFilter } from "@/lib/validators/product";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  // Force the category filter to this route's category.
  const filter = { ...parseProductFilter(await searchParams), category: slug };
  return (
    <ProductListing filter={filter} heading={category.name} lockCategory />
  );
}
