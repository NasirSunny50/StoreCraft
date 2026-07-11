import { prisma } from "@/lib/prisma";
import { looksLikeEmail, normalizeBdPhone } from "@/lib/utils/phone";

/**
 * Resolve a login identifier (mobile number OR email) to a user. Emails match
 * directly; anything else is normalised as a BD phone. Shared by the auth
 * provider and the login action.
 */
export async function findUserByIdentifier(identifier: string) {
  const id = identifier.trim();
  if (looksLikeEmail(id)) {
    return prisma.user.findUnique({ where: { email: id.toLowerCase() } });
  }
  const phone = normalizeBdPhone(id);
  if (!phone) return null;
  return prisma.user.findUnique({ where: { phone } });
}
