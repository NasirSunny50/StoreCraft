import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-guard";
import { getAdminProduct } from "@/lib/queries/admin-product";
import { getCategories, getBrands } from "@/lib/queries/product";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Edit Product — Admin" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [product, categories, brands] = await Promise.all([
    getAdminProduct(id),
    getCategories(),
    getBrands(),
  ]);
  if (!product) notFound();

  return (
    <div>
      <AdminPageHeader title="Edit Product" testId="admin-heading" />
      <ProductForm
        mode="edit"
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price.toString(),
          comparePrice: product.comparePrice?.toString() ?? "",
          costPrice: product.costPrice?.toString() ?? "",
          stock: product.stock,
          lowStockAt: product.lowStockAt,
          categoryId: product.categoryId,
          brandId: product.brandId ?? "",
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          warranty: product.warranty ?? "",
          colors: product.colors,
          specs: product.specs.map((s) => ({ key: s.key, value: s.value })),
          images: product.images.map((i) => i.url),
        }}
      />
    </div>
  );
}
