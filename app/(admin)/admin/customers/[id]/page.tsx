import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { getCustomer } from "@/lib/queries/admin-misc";
import { formatBDT } from "@/lib/utils/money";
import { AdminPageHeader } from "@/components/admin/page-header";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { CustomerBlockButton } from "@/components/admin/customer-block-button";

export const metadata = { title: "Customer — Admin" };

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer || customer.role !== "CUSTOMER") notFound();

  return (
    <div>
      <AdminPageHeader title={customer.name} testId="admin-heading">
        <Link href="/admin/customers" className="text-xs text-link hover:underline">← All customers</Link>
      </AdminPageHeader>

      <div className="mb-4 flex items-center gap-4 rounded border border-hairline bg-surface p-4 text-sm">
        <div className="flex-1">
          <div className="text-muted">{customer.email}</div>
          <div className="text-muted">Joined {new Date(customer.createdAt).toLocaleDateString()}</div>
          <div className="mt-1">
            Status:{" "}
            <span data-testid="customer-status" className={customer.isBlocked ? "font-semibold text-accent" : "text-green-700"}>
              {customer.isBlocked ? "Blocked" : "Active"}
            </span>
          </div>
        </div>
        <CustomerBlockButton userId={customer.id} blocked={customer.isBlocked} />
      </div>

      <h2 className="mb-2 text-sm font-bold text-ink">Order history ({customer.orders.length})</h2>
      <div className="overflow-x-auto rounded border border-hairline">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface-2 text-left text-xs text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Order</th>
              <th className="px-3 py-2 font-medium">Total</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {customer.orders.map((o) => (
              <tr key={o.id} className="bg-surface">
                <td className="px-3 py-2">
                  <Link href={`/admin/orders/${o.id}`} className="text-link hover:underline">{o.orderNumber}</Link>
                </td>
                <td className="px-3 py-2 font-medium text-accent">{formatBDT(o.total)}</td>
                <td className="px-3 py-2"><OrderStatusBadge status={o.status} /></td>
                <td className="px-3 py-2 text-muted">{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {customer.orders.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-muted">No orders yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
