import { notFound } from "next/navigation";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { Phone, Mail, CalendarDays } from "lucide-react";
import { requireAdmin } from "@/lib/auth-guard";
import { getCustomer } from "@/lib/queries/admin-misc";
import { formatBDT } from "@/lib/utils/money";
import { AdminPageHeader } from "@/components/admin/page-header";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { CustomerBlockButton } from "@/components/admin/customer-block-button";

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

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

  const totalSpent = customer.orders.reduce(
    (acc, o) => acc.plus(o.total),
    new Prisma.Decimal(0),
  );

  return (
    <div>
      <AdminPageHeader title={customer.name} testId="admin-heading">
        <Link href="/admin/customers" className="text-xs text-link hover:underline">← All customers</Link>
      </AdminPageHeader>

      <section className="mb-5 rounded-xl border border-hairline bg-surface p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-accent/10 text-xl font-bold text-accent">
              {initials(customer.name)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-ink">{customer.name}</h2>
                <span
                  data-testid="customer-status"
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    customer.isBlocked
                      ? "bg-accent/10 text-accent"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {customer.isBlocked ? "Blocked" : "Active"}
                </span>
              </div>
              <div className="mt-1.5 space-y-1 text-sm text-muted">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-accent" /> {customer.phone ?? "—"}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-accent" /> {customer.email ?? "No email on file"}
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-accent" /> Joined {new Date(customer.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
          <CustomerBlockButton userId={customer.id} blocked={customer.isBlocked} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-hairline pt-4 sm:grid-cols-3">
          <Stat label="Total orders" value={String(customer.orders.length)} />
          <Stat label="Total order value" value={formatBDT(totalSpent)} />
          <Stat
            label="Customer since"
            value={new Date(customer.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
          />
        </div>
      </section>

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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-2 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className="text-base font-bold text-ink">{value}</div>
    </div>
  );
}
