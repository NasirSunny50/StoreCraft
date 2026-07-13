import bcrypt from "bcryptjs";

// 12 rounds ≈ well above the 10 default — stronger against offline cracking
// while staying fast enough for interactive login on serverless.
const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
