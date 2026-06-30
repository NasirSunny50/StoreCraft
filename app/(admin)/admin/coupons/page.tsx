import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/page-header";
import { CouponManager, type CouponView } from "@/components/admin/coupon-manager";

export const metadata = { title: "Coupons — Admin" };

export default async function AdminCouponsPage() {
  await requireAdmin();
  const rows = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  const coupons: CouponView[] = rows.map((c) => ({
    id: c.id,
    code: c.code,
    type: c.type,
    value: c.value.toString(),
    minOrder: c.minOrder.toString(),
    usageLimit: c.usageLimit,
    usedCount: c.usedCount,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString().slice(0, 10) : null,
    isActive: c.isActive,
  }));

  return (
    <div>
      <AdminPageHeader title="Coupons" testId="admin-heading" />
      <CouponManager coupons={coupons} />
    </div>
  );
}
