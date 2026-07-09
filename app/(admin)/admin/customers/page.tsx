import Link from "next/link";
import { requireAdmin } from "@/lib/auth-guard";
import { getCustomers } from "@/lib/queries/admin-misc";
import { AdminPageHeader } from "@/components/admin/page-header";
import { CustomerBlockButton } from "@/components/admin/customer-block-button";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { parsePageParams } from "@/lib/pagination";

export const metadata = { title: "Customers — Admin" };

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; perPage?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const { q } = sp;
  const { page, perPage, skip, take } = parsePageParams(sp);
  const { items: customers, total } = await getCustomers({ q, skip, take });

  return (
    <div>
      <AdminPageHeader title="Customers" testId="admin-heading" />

      <form action="/admin/customers" className="mb-3 flex gap-2">
        <input name="q" defaultValue={q ?? ""} placeholder="Search name or email…" className="w-64 rounded border border-hairline-strong px-3 py-1.5 text-sm" />
        <input type="hidden" name="perPage" value={perPage} />
        <button className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-white">Search</button>
      </form>

      <div className="overflow-x-auto rounded border border-hairline">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-surface-2 text-left text-xs text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Orders</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {customers.map((c) => (
              <tr key={c.id} data-testid="customer-row" data-email={c.email} className="bg-surface">
                <td className="px-3 py-2">
                  <Link href={`/admin/customers/${c.id}`} className="font-medium text-link hover:underline">{c.name}</Link>
                </td>
                <td className="px-3 py-2 text-muted">{c.email}</td>
                <td className="px-3 py-2 text-muted">{c._count.orders}</td>
                <td className="px-3 py-2">
                  <span data-testid="customer-status" className={c.isBlocked ? "font-semibold text-accent" : "text-green-700"}>
                    {c.isBlocked ? "Blocked" : "Active"}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <CustomerBlockButton userId={c.id} blocked={c.isBlocked} />
                </td>
              </tr>
            ))}
            {customers.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-muted">No customers.</td></tr>}
          </tbody>
        </table>
      </div>

      <AdminPagination total={total} page={page} perPage={perPage} />
    </div>
  );
}
