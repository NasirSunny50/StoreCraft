import type { Role } from "@prisma/client";

/** Roles allowed into the admin portal. */
export const ADMIN_PORTAL_ROLES: Role[] = ["ADMIN", "STAFF"];

/** True if `role` is defined and one of `allowed`. Pure — safe to unit test. */
export function hasRole(role: Role | undefined, ...allowed: Role[]): boolean {
  return role !== undefined && allowed.includes(role);
}

/** True if the role may access the admin portal. */
export function canAccessAdmin(role: Role | undefined): boolean {
  return hasRole(role, ...ADMIN_PORTAL_ROLES);
}
