import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { ADMIN_PORTAL_ROLES, hasRole, canAccessAdmin } from "@/lib/utils/roles";

// Re-export pure role helpers so callers can import everything from one place.
export { ADMIN_PORTAL_ROLES, hasRole, canAccessAdmin };

/**
 * Require a logged-in user. Redirects to /login otherwise. Pass `callbackUrl`
 * (the path the user was trying to reach) so login/register can send them back
 * there instead of the homepage.
 */
export async function requireAuth(callbackUrl?: string) {
  const session = await auth();
  if (!session?.user) {
    redirect(
      callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login",
    );
  }
  return session;
}

/**
 * Require one of the given roles. Redirects unauthenticated users to /login and
 * authenticated-but-unauthorized users to /forbidden. Returns the session.
 */
export async function requireRole(...roles: Role[]) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!roles.includes(session.user.role)) redirect("/forbidden");
  return session;
}

/** ADMIN-only guard (products, customers, coupons, reports, settings). */
export async function requireAdmin() {
  return requireRole("ADMIN");
}

/** Admin portal guard — ADMIN or STAFF (orders, inventory, dashboard). */
export async function requireStaff() {
  return requireRole("ADMIN", "STAFF");
}
