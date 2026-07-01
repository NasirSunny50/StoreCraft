import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/page-header";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { parsePageParams } from "@/lib/pagination";

export const metadata = { title: "Categories — Admin" };

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; perPage?: string }>;
}) {
  await requireAdmin();
  const { page, perPage, skip, take } = parsePageParams(await searchParams);
  const [rows, total] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
      skip,
      take,
    }),
    prisma.category.count(),
  ]);
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
      <AdminPagination total={total} page={page} perPage={perPage} />
    </div>
  );
}
