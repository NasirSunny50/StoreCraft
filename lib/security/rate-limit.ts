import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/** Max failed login attempts allowed per IP within the window. */
const MAX_ATTEMPTS = 8;
/** Sliding window length in minutes. */
const WINDOW_MINUTES = 15;

/** Best-effort client IP from the proxy headers Vercel/Cloudflare set. */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Returns whether this IP is currently rate-limited for login, i.e. it has hit
 * the failure ceiling inside the window. Fails open on DB errors so a database
 * hiccup can never lock every user out of signing in.
 */
export async function isLoginRateLimited(ip: string): Promise<boolean> {
  if (ip === "unknown") return false;
  try {
    const since = new Date(Date.now() - WINDOW_MINUTES * 60_000);
    const recent = await prisma.loginAttempt.count({
      where: { ip, createdAt: { gte: since } },
    });
    return recent >= MAX_ATTEMPTS;
  } catch {
    return false;
  }
}

/** Record a failed login for this IP and opportunistically prune stale rows. */
export async function recordLoginFailure(ip: string): Promise<void> {
  if (ip === "unknown") return;
  try {
    const cutoff = new Date(Date.now() - WINDOW_MINUTES * 60_000);
    await prisma.$transaction([
      prisma.loginAttempt.create({ data: { ip } }),
      prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    ]);
  } catch {
    /* throttling is best-effort — never block a login on a logging failure */
  }
}

/** Clear an IP's failure history after a successful login. */
export async function clearLoginFailures(ip: string): Promise<void> {
  if (ip === "unknown") return;
  try {
    await prisma.loginAttempt.deleteMany({ where: { ip } });
  } catch {
    /* non-fatal */
  }
}

export const LOGIN_RATE_LIMIT_MESSAGE =
  "Too many login attempts. Please wait a few minutes and try again.";
