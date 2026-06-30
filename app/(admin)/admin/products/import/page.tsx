import { requireAdmin } from "@/lib/auth-guard";
import { AdminPageHeader } from "@/components/admin/page-header";
import { CsvImport } from "@/components/admin/csv-import";

export const metadata = { title: "Import Products — Admin" };

export default async function ImportProductsPage() {
  await requireAdmin();
  return (
    <div>
      <AdminPageHeader title="Bulk Import Products (CSV)" testId="admin-heading" />
      <CsvImport />
    </div>
  );
}
