import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/utils/password";

describe("password hashing", () => {
  it("produces a bcrypt hash that is not the plaintext", async () => {
    const hash = await hashPassword("supersecret");
    expect(hash).not.toBe("supersecret");
    expect(hash.startsWith("$2")).toBe(true);
  });

  it("verifies a correct password", async () => {
    const hash = await hashPassword("supersecret");
    expect(await verifyPassword("supersecret", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("supersecret");
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("produces different hashes for the same input (random salt)", async () => {
    const a = await hashPassword("supersecret");
    const b = await hashPassword("supersecret");
    expect(a).not.toBe(b);
  });
});
