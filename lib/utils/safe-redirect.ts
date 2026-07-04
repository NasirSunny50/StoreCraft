/**
 * Return a post-login callback path only if it's a safe, internal, same-origin
 * path (a single leading "/", not "//" or "/\" which browsers treat as
 * protocol-relative). Anything else — absolute URLs, missing values — returns
 * null, so a crafted `?callbackUrl=` can never redirect users off-site.
 */
export function safeCallbackUrl(
  raw: FormDataEntryValue | string | null | undefined,
): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}
