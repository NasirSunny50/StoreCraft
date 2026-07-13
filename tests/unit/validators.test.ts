import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema, profileSchema } from "@/lib/validators/auth";

describe("registerSchema", () => {
  const valid = {
    name: "Jane Doe",
    phone: "01712345678",
    email: "Jane@Example.com",
    password: "supersecret1",
    confirmPassword: "supersecret1",
  };

  it("accepts valid input, normalizes email + phone", () => {
    const result = registerSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("jane@example.com");
      expect(result.data.phone).toBe("01712345678");
    }
  });

  it("normalizes +880 / spaced phone to 01XXXXXXXXX", () => {
    const result = registerSchema.safeParse({ ...valid, phone: "+880 1712-345678" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.phone).toBe("01712345678");
  });

  it("treats email as optional (blank allowed)", () => {
    const result = registerSchema.safeParse({ ...valid, email: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBeUndefined();
  });

  it("rejects an invalid phone number", () => {
    expect(registerSchema.safeParse({ ...valid, phone: "12345" }).success).toBe(false);
  });

  it("rejects mismatched passwords on confirmPassword path", () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: "nope" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword).toBeDefined();
    }
  });

  it("rejects passwords shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ ...valid, password: "short", confirmPassword: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects a letters-only password (no number)", () => {
    const result = registerSchema.safeParse({ ...valid, password: "onlyletters", confirmPassword: "onlyletters" });
    expect(result.success).toBe(false);
  });

  it("rejects a digits-only password (no letter)", () => {
    const result = registerSchema.safeParse({ ...valid, password: "12345678", confirmPassword: "12345678" });
    expect(result.success).toBe(false);
  });

  it("rejects a set-but-invalid email", () => {
    expect(registerSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects names shorter than 2 characters", () => {
    expect(registerSchema.safeParse({ ...valid, name: "J" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts a mobile-number identifier", () => {
    expect(loginSchema.safeParse({ identifier: "01712345678", password: "x" }).success).toBe(true);
  });

  it("accepts an email identifier", () => {
    expect(loginSchema.safeParse({ identifier: "a@b.com", password: "x" }).success).toBe(true);
  });

  it("rejects empty password", () => {
    expect(loginSchema.safeParse({ identifier: "a@b.com", password: "" }).success).toBe(false);
  });

  it("rejects an empty identifier", () => {
    expect(loginSchema.safeParse({ identifier: "", password: "x" }).success).toBe(false);
  });
});

describe("profileSchema", () => {
  it("accepts name with optional email", () => {
    expect(profileSchema.safeParse({ name: "Jane Doe", email: "" }).success).toBe(true);
    expect(profileSchema.safeParse({ name: "Jane Doe", email: "jane@x.com" }).success).toBe(true);
  });

  it("rejects an invalid email when provided", () => {
    expect(profileSchema.safeParse({ name: "Jane Doe", email: "nope" }).success).toBe(false);
  });
});
