/**
 * Bangladesh mobile number helpers. We store the canonical 11-digit local form
 * (01XXXXXXXXX) so the same number typed as +8801… or 8801… logs in the same
 * account.
 */

/** Normalise a BD mobile number to 01XXXXXXXXX, or null if it isn't valid. */
export function normalizeBdPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let local = digits;
  if (local.startsWith("880")) local = local.slice(3);
  else if (local.startsWith("0088")) local = local.slice(4);
  if (local.length === 10 && local.startsWith("1")) local = "0" + local; // 1XXXXXXXXX → 01XXXXXXXXX
  if (/^01[3-9]\d{8}$/.test(local)) return local;
  return null;
}

/** True when the string looks like an email (used to route login lookups). */
export function looksLikeEmail(input: string): boolean {
  return input.includes("@");
}
