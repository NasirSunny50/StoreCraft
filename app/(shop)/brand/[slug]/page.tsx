import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductListing } from "@/components/product/product-listing";
import { parseProductFilter } from "@/lib/validators/product";

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const brand = await prisma.brand.findUnique({ where: { slug } });
  if (!brand) notFound();

  const filter = { ...parseProductFilter(await searchParams), brand: slug };
  return <ProductListing filter={filter} heading={brand.name} lockBrand />;
}
