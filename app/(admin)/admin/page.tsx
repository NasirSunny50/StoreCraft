import { requireRole, ADMIN_PORTAL_ROLES } from "@/lib/auth-guard";

export const metadata = { title: "Admin — StoreCraft" };

export default async function AdminDashboardPage() {
  const session = await requireRole(...ADMIN_PORTAL_ROLES);

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold" data-testid="admin-heading">
        Admin Dashboard
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Signed in as <strong>{session.user.email}</strong> with role{" "}
        <strong>{session.user.role}</strong>.
      </p>
      <p className="text-sm text-gray-500">
        Dashboard widgets and management tools arrive in Phase 4.
      </p>
    </section>
  );
}
