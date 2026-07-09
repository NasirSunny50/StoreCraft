import { requireAdmin } from "@/lib/auth-guard";
import { getBranding } from "@/lib/branding";
import { AdminPageHeader } from "@/components/admin/page-header";
import { BrandingForm } from "@/components/admin/branding-form";

export const metadata = { title: "Store Branding — Admin" };

export default async function AdminBrandingPage() {
  await requireAdmin();
  const branding = await getBranding();

  return (
    <div>
      <AdminPageHeader title="Store Branding" testId="admin-heading" />
      <p className="mb-4 max-w-2xl text-xs text-muted">
        Customise how your store looks and identifies itself — shop name, logo,
        contact details and SEO. Changes apply across the storefront, admin,
        emails and browser tab.
      </p>
      <div className="max-w-2xl">
        <BrandingForm initial={branding} />
      </div>
    </div>
  );
}
