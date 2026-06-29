import { describe, it, expect } from "vitest";
import { hasRole, canAccessAdmin, ADMIN_PORTAL_ROLES } from "@/lib/utils/roles";

describe("hasRole", () => {
  it("returns true when role is in the allowed list", () => {
    expect(hasRole("ADMIN", "ADMIN", "STAFF")).toBe(true);
    expect(hasRole("STAFF", "ADMIN", "STAFF")).toBe(true);
  });

  it("returns false when role is not allowed", () => {
    expect(hasRole("CUSTOMER", "ADMIN", "STAFF")).toBe(false);
  });

  it("returns false for undefined role", () => {
    expect(hasRole(undefined, "ADMIN")).toBe(false);
  });
});

describe("canAccessAdmin", () => {
  it("allows ADMIN and STAFF", () => {
    expect(canAccessAdmin("ADMIN")).toBe(true);
    expect(canAccessAdmin("STAFF")).toBe(true);
  });

  it("denies CUSTOMER and undefined", () => {
    expect(canAccessAdmin("CUSTOMER")).toBe(false);
    expect(canAccessAdmin(undefined)).toBe(false);
  });

  it("ADMIN_PORTAL_ROLES contains exactly ADMIN and STAFF", () => {
    expect([...ADMIN_PORTAL_ROLES].sort()).toEqual(["ADMIN", "STAFF"]);
  });
});
