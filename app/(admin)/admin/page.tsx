import Link from "next/link";
import { requireStaff } from "@/lib/auth-guard";
import { getDashboardStats } from "@/lib/queries/admin-dashboard";
import { formatBDT } from "@/lib/utils/money";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Dashboard — Admin" };

const RANGES: { key: string; label: string; days: number | null }[] = [
  { key: "7", label: "7 days", days: 7 },
  { key: "30", label: "30 days", days: 30 },
  { key: "all", label: "All time", days: null },
];

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requireStaff();
  const { range } = await searchParams;
  const active = RANGES.find((r) => r.key === range) ?? RANGES[2]!;
  const stats = await getDashboardStats(active.days);

  const maxStatus = Math.max(1, ...stats.byStatus.map((s) => s.count));
  const maxTop = Math.max(1, ...stats.top.map((t) => t.qty));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 data-testid="admin-heading" className="text-xl font-bold text-ink">Dashboard</h1>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/admin?range=${r.key}`}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-medium",
                active.key === r.key ? "bg-accent text-white" : "bg-surface-2 text-muted hover:text-ink",
              )}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card label="Revenue" value={formatBDT(stats.revenue)} testId="stat-revenue" accent />
        <Card label="Orders" value={String(stats.orderCount)} testId="stat-orders" />
        <Card label="Customers" value={String(stats.customerCount)} testId="stat-customers" />
        <Card label="Low-stock items" value={String(stats.lowStock)} testId="stat-lowstock" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded border border-hairline bg-surface p-4">
          <h2 className="mb-3 text-sm font-bold">Orders by status</h2>
          <div className="space-y-2">
            {stats.byStatus.length === 0 && <p className="text-sm text-muted">No orders yet.</p>}
            {stats.byStatus.map((s) => (
              <div key={s.status} className="flex items-center gap-3 text-sm">
                <div className="w-24"><OrderStatusBadge status={s.status} /></div>
                <div className="h-3 flex-1 rounded bg-surface-2">
                  <div className="h-3 rounded bg-accent" style={{ width: `${(s.count / maxStatus) * 100}%` }} />
                </div>
                <span className="w-8 text-right font-medium">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-hairline bg-surface p-4">
          <h2 className="mb-3 text-sm font-bold">Top products (units sold)</h2>
          <div className="space-y-2">
            {stats.top.length === 0 && <p className="text-sm text-muted">No sales yet.</p>}
            {stats.top.map((t, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="w-40 truncate">{t.name}</span>
                <div className="h-3 flex-1 rounded bg-surface-2">
                  <div className="h-3 rounded bg-navbar" style={{ width: `${(t.qty / maxTop) * 100}%` }} />
                </div>
                <span className="w-8 text-right font-medium">{t.qty}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, testId, accent }: { label: string; value: string; testId: string; accent?: boolean }) {
  return (
    <div className="rounded border border-hairline bg-surface p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div data-testid={testId} className={cn("mt-1 text-2xl font-bold", accent ? "text-accent" : "text-ink")}>
        {value}
      </div>
    </div>
  );
}
