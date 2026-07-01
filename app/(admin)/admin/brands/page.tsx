import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/page-header";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { parsePageParams } from "@/lib/pagination";

export const metadata = { title: "Brands — Admin" };

export default async function AdminBrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; perPage?: string }>;
}) {
  await requireAdmin();
  const { page, perPage, skip, take } = parsePageParams(await searchParams);
  const [rows, total] = await Promise.all([
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
      skip,
      take,
    }),
    prisma.brand.count(),
  ]);
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
      <AdminPagination total={total} page={page} perPage={perPage} />
    </div>
  );
}
