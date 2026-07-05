import { requireAdmin } from "@/lib/auth-guard";
import { getShippingFee } from "@/lib/settings";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ShippingFeeForm } from "@/components/admin/shipping-fee-form";

export const metadata = { title: "Settings — Admin" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const shippingFee = await getShippingFee();

  return (
    <div>
      <AdminPageHeader title="Settings" testId="admin-heading" />
      <section className="max-w-md rounded border border-hairline bg-surface p-4">
        <h2 className="mb-3 text-sm font-bold text-ink">Delivery</h2>
        <ShippingFeeForm current={shippingFee} />
      </section>
    </div>
  );
}
