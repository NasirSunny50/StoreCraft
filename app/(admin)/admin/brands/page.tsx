import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/page-header";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";

export const metadata = { title: "Brands — Admin" };

export default async function AdminBrandsPage() {
  await requireAdmin();
  const rows = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  const items = rows.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    productCount: b._count.products,
  }));

  return (
    <div>
      <AdminPageHeader title="Brands" testId="admin-heading" />
      <TaxonomyManager kind="brand" items={items} />
    </div>
  );
}
