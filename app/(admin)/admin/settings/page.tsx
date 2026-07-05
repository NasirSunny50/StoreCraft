import { requireAdmin } from "@/lib/auth-guard";
import { getDeliveryFees } from "@/lib/settings";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DeliveryFeesForm } from "@/components/admin/delivery-fees-form";

export const metadata = { title: "Settings — Admin" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const fees = await getDeliveryFees();

  return (
    <div>
      <AdminPageHeader title="Settings" testId="admin-heading" />
      <section className="max-w-md rounded border border-hairline bg-surface p-4">
        <h2 className="mb-1 text-sm font-bold text-ink">Delivery charges</h2>
        <p className="mb-3 text-xs text-muted">
          Applied by destination at checkout and on new orders. Past orders keep
          the charge they were placed with.
        </p>
        <DeliveryFeesForm insideDhaka={fees.insideDhaka} outsideDhaka={fees.outsideDhaka} />
      </section>
    </div>
  );
}
