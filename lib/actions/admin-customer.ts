"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

/** Block / unblock a customer. Blocked users cannot authenticate (see lib/auth). */
export async function setUserBlocked(
  userId: string,
  blocked: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireAdmin();
  if (session.user.id === userId) {
    return { ok: false, error: "You cannot block your own account." };
  }
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!target) return { ok: false, error: "User not found." };
  if (target.role !== "CUSTOMER") {
    return { ok: false, error: "Only customers can be blocked." };
  }

  await prisma.user.update({ where: { id: userId }, data: { isBlocked: blocked } });
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${userId}`);
  return { ok: true };
}
