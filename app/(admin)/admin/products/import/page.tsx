import { requireAdmin } from "@/lib/auth-guard";
import { AdminPageHeader } from "@/components/admin/page-header";
import { CsvImport } from "@/components/admin/csv-import";

export const metadata = { title: "Import Products — Admin" };

export default async function ImportProductsPage() {
  await requireAdmin();
  return (
    <div>
      <AdminPageHeader title="Import Products" testId="admin-heading" />
      <p className="mb-4 max-w-3xl text-xs text-muted">
        Add many products at once from a CSV file — download the template, fill it in, and upload.
      </p>
      <CsvImport />
    </div>
  );
}
