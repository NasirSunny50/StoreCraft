import { NextResponse } from "next/server";

/**
 * Standalone animated "processing" page shown when the browser returns from the
 * SSLCommerz gateway to one of our callback routes. The callback receives the
 * gateway POST, renders this page instantly, and the page auto-submits the same
 * fields back (with a finalize marker) so the real server-side validation runs
 * with our loader on screen — replacing the blank white flash the user sees
 * while we confirm the payment.
 *
 * It's raw HTML/CSS (returned from a Route Handler, not React) and self-contained.
 */

/** Marker field name that flips a callback from "show loader" to "finalize now". */
export const FINALIZE_STEP = "__sc_step";
export const FINALIZE_VALUE = "finalize";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const SHIELD_SVG =
  '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>';

/** Build the processing HTML. `fields` are re-posted verbatim to `actionUrl`. */
export function renderPaymentProcessingPage(opts: {
  actionUrl: string;
  fields: Record<string, string>;
  title?: string;
  subtitle?: string;
}): string {
  const title = esc(opts.title ?? "Confirming your payment");
  const subtitle = esc(
    opts.subtitle ??
      "Please wait while we securely confirm your payment and finalize your order.",
  );
  const inputs = Object.entries(opts.fields)
    .map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`)
    .join("");
  const chips = ["bKash", "Nagad", "Rocket", "Visa", "Mastercard"]
    .map((m) => `<span class="chip">${m}</span>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Processing payment…</title>
<style>
  :root{--brand:#5a6ef0;--brand2:#8b5cf6;--ink:#1f2430;--muted:#8a90a2}
  *{box-sizing:border-box}
  html,body{margin:0;height:100%}
  body{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink);background:radial-gradient(1200px 600px at 50% -10%,#eef1ff 0%,#f6f7fb 55%,#f3f4f8 100%);display:grid;place-items:center;min-height:100vh;padding:16px}
  .card{position:relative;width:min(92vw,410px);background:#fff;border-radius:28px;overflow:hidden;box-shadow:0 1px 2px rgba(31,36,48,.04),0 30px 70px -20px rgba(90,110,240,.35);animation:fadeup .45s cubic-bezier(.2,.7,.2,1) both}
  .crest{position:relative;padding:44px 32px 34px;text-align:center;color:#fff;background:linear-gradient(140deg,var(--brand),var(--brand2))}
  .crest::before{content:"";position:absolute;inset:0;background:radial-gradient(340px 160px at 50% 0%,rgba(255,255,255,.28),transparent 70%);pointer-events:none}
  .rw{position:relative;width:104px;height:104px;margin:0 auto;display:grid;place-items:center}
  .rw .halo{position:absolute;inset:-6px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.35),transparent 62%);filter:blur(2px)}
  .rw .ping{position:absolute;inset:6px;border-radius:50%;border:1.5px solid rgba(255,255,255,.55);animation:ping 2.1s cubic-bezier(0,0,.2,1) infinite}
  .rw .ping.d{animation-delay:.7s}
  .rw .spin{position:absolute;inset:8px;border-radius:50%;border:3px solid rgba(255,255,255,.28);border-top-color:#fff;animation:spin 1.05s linear infinite}
  .rw .badge{position:relative;width:62px;height:62px;border-radius:50%;background:#fff;color:var(--brand);display:grid;place-items:center;box-shadow:0 10px 22px rgba(31,36,48,.18);animation:float 2.6s ease-in-out infinite}
  .title{position:relative;margin:22px 0 6px;font-size:20px;font-weight:700;letter-spacing:-.01em}
  .sub{position:relative;margin:0 auto;max-width:19rem;font-size:13.5px;color:rgba(255,255,255,.92);line-height:1.55}
  .body{padding:24px 30px 26px}
  .bar{position:relative;height:6px;border-radius:999px;background:#eceefb;overflow:hidden}
  .bar span{position:absolute;top:0;bottom:0;left:0;width:38%;border-radius:999px;background:linear-gradient(90deg,transparent,var(--brand),var(--brand2),transparent);animation:shimmer 1.25s ease-in-out infinite}
  .chips{margin:18px 0 14px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
  .chip{font-size:11px;color:#5b617a;background:#f3f4fb;border:1px solid #e8eafc;border-radius:999px;padding:4px 11px;font-weight:600}
  .foot{margin:0;display:flex;align-items:center;justify-content:center;gap:8px;font-size:12.5px;color:var(--muted)}
  .dots{display:inline-flex;gap:4px}
  .dots i{width:5px;height:5px;border-radius:50%;background:var(--brand);opacity:.55;animation:blink 1.2s ease-in-out infinite}
  .dots i:nth-child(2){animation-delay:.2s}
  .dots i:nth-child(3){animation-delay:.4s}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes ping{0%{transform:scale(.85);opacity:.7}75%,100%{transform:scale(1.7);opacity:0}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes shimmer{0%{transform:translateX(-120%)}100%{transform:translateX(320%)}}
  @keyframes fadeup{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}
  @keyframes blink{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-2px)}}
  @media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
</head>
<body>
  <form id="scf" method="POST" action="${esc(opts.actionUrl)}">${inputs}</form>
  <div class="card" role="status" aria-live="polite">
    <div class="crest">
      <div class="rw">
        <span class="halo"></span>
        <span class="ping"></span><span class="ping d"></span><span class="spin"></span>
        <span class="badge">${SHIELD_SVG}</span>
      </div>
      <h1 class="title">${title}</h1>
      <p class="sub">${subtitle}</p>
    </div>
    <div class="body">
      <div class="bar"><span></span></div>
      <div class="chips">${chips}</div>
      <p class="foot"><span class="dots"><i></i><i></i><i></i></span> You&#39;ll be redirected automatically — please keep this window open.</p>
    </div>
  </div>
  <noscript>
    <div style="text-align:center;margin-top:16px">
      <button form="scf" type="submit" style="padding:10px 20px;border-radius:999px;border:0;background:#5a6ef0;color:#fff;font-weight:600;cursor:pointer">Continue</button>
    </div>
  </noscript>
  <script>window.addEventListener("load",function(){setTimeout(function(){document.getElementById("scf").submit()},150)})</script>
</body>
</html>`;
}

/** Convenience: the processing page as an HTML Response. */
export function paymentProcessingResponse(opts: Parameters<typeof renderPaymentProcessingPage>[0]) {
  return new NextResponse(renderPaymentProcessingPage(opts), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
