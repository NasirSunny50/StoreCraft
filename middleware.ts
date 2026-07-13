import { NextRequest, NextResponse } from "next/server";

/**
 * Security middleware — attaches a strict, nonce-based Content-Security-Policy
 * plus the standard hardening headers to every HTML response.
 *
 * The nonce is generated per request and forwarded to the app via the `x-nonce`
 * request header; Next.js automatically stamps it onto its own <script> tags so
 * that `'strict-dynamic'` lets the framework bootstrap while blocking any
 * injected/inline script an attacker might smuggle in (XSS mitigation).
 */
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const isDev = process.env.NODE_ENV !== "production";
  // Dev needs 'unsafe-eval' for React Fast Refresh / HMR; production stays strict.
  const scriptSrc = isDev
    ? `'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
    : `'self' 'nonce-${nonce}' 'strict-dynamic'`;

  const csp = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    // Tailwind + inline style attributes (e.g. dynamic column widths) need this.
    `style-src 'self' 'unsafe-inline'`,
    // Images can't execute, so allow any HTTPS source — product photos come
    // from Cloudinary, local /uploads, and seeded placeholder hosts.
    `img-src 'self' data: blob: https:`,
    `font-src 'self'`,
    `connect-src 'self'`,
    `frame-src 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  response.headers.set("content-security-policy", csp);
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "permissions-policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  );
  response.headers.set("x-dns-prefetch-control", "off");
  // HSTS: force HTTPS for a year (incl. subdomains). Ignored on http/localhost.
  response.headers.set(
    "strict-transport-security",
    "max-age=31536000; includeSubDomains; preload",
  );

  return response;
}

export const config = {
  // Run on pages, skip Next internals, the auth API, and static assets so the
  // CSP nonce only applies where HTML/JS is served.
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
