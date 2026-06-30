import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/page-header";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";

export const metadata = { title: "Categories — Admin" };

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const rows = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  const items = rows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    productCount: c._count.products,
  }));

  return (
    <div>
      <AdminPageHeader title="Categories" testId="admin-heading" />
      <TaxonomyManager kind="category" items={items} />
    </div>
  );
}
