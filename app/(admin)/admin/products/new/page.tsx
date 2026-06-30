import { requireAdmin } from "@/lib/auth-guard";
import { getCategories, getBrands } from "@/lib/queries/product";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "New Product — Admin" };

export default async function NewProductPage() {
  await requireAdmin();
  const [categories, brands] = await Promise.all([getCategories(), getBrands()]);
  return (
    <div>
      <AdminPageHeader title="New Product" testId="admin-heading" />
      <ProductForm
        mode="create"
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
      />
    </div>
  );
}
