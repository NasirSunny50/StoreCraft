import { requireAdmin } from "@/lib/auth-guard";
import { getBannerSet } from "@/lib/banners";
import { AdminPageHeader } from "@/components/admin/page-header";
import { BannerManager } from "@/components/admin/banner-manager";

export const metadata = { title: "Homepage Banners — Admin" };

export default async function AdminBannersPage() {
  await requireAdmin();
  const banners = await getBannerSet();

  return (
    <div>
      <AdminPageHeader title="Homepage Banners" testId="admin-heading" />
      <p className="mb-4 max-w-2xl text-xs text-muted">
        Manage the homepage hero — the large rotating slider plus the two small side promo boxes.
        Upload images, set optional click-through links, and reorder the slider so the most important
        banner shows first.
      </p>
      <div className="max-w-3xl">
        <BannerManager initial={banners} />
      </div>
    </div>
  );
}
