"use client";

import { ShieldCheck, Lock, CreditCard } from "lucide-react";

/**
 * Full-screen animated overlay shown while the browser is being sent to the
 * SSLCommerz hosted gateway. Replaces the blank/minimal flash during
 * `window.location.href = …` with a polished "redirecting to secure payment"
 * state so the wait feels intentional and trustworthy.
 */
export function PaymentRedirectOverlay() {
  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      aria-label="Redirecting to secure payment"
      data-testid="payment-redirect-overlay"
      className="fixed inset-0 z-[100] grid place-items-center bg-ink/70 p-4 backdrop-blur-sm"
    >
      <style>{`
        @keyframes pro-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
        @keyframes pro-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes pro-fade-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes pro-spin { to { transform: rotate(360deg); } }
        @keyframes pro-ping { 75%,100% { transform: scale(1.9); opacity: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .pro-anim, .pro-anim * { animation: none !important; }
        }
      `}</style>

      <div
        className="pro-anim w-[min(92vw,400px)] overflow-hidden rounded-3xl border border-white/10 bg-surface text-center shadow-2xl"
        style={{ animation: "pro-fade-up .3s ease-out both" }}
      >
        {/* Animated crest */}
        <div className="relative bg-[linear-gradient(135deg,#e74c3c,#cf3f2f)] px-8 pb-8 pt-10">
          <div className="relative mx-auto grid h-24 w-24 place-items-center">
            {/* expanding rings */}
            <span className="absolute inset-0 rounded-full bg-white/25" style={{ animation: "pro-ping 1.8s cubic-bezier(0,0,0.2,1) infinite" }} />
            <span className="absolute inset-2 rounded-full bg-white/20" style={{ animation: "pro-ping 1.8s cubic-bezier(0,0,0.2,1) .4s infinite" }} />
            {/* spinning accent ring */}
            <span className="absolute inset-1 rounded-full border-2 border-white/30 border-t-white" style={{ animation: "pro-spin 1s linear infinite" }} />
            {/* center badge */}
            <span
              className="relative grid h-16 w-16 place-items-center rounded-full bg-white text-accent shadow-lg"
              style={{ animation: "pro-float 2.4s ease-in-out infinite" }}
            >
              <ShieldCheck className="h-8 w-8" />
            </span>
          </div>
          <h2 className="mt-5 text-lg font-bold text-white">Redirecting to secure payment</h2>
          <p className="mt-1 text-sm text-white/85">
            Hold on — we&apos;re taking you to SSLCommerz to complete your payment safely.
          </p>
        </div>

        {/* Indeterminate progress + reassurance */}
        <div className="space-y-4 px-8 py-6">
          <div className="relative h-1.5 overflow-hidden rounded-full bg-surface-2">
            <span
              className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-[linear-gradient(90deg,transparent,#e74c3c,transparent)]"
              style={{ animation: "pro-shimmer 1.2s ease-in-out infinite" }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {["bKash", "Nagad", "Rocket", "Visa", "Mastercard"].map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1 rounded-full border border-hairline bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-muted"
              >
                <CreditCard className="h-3 w-3" /> {m}
              </span>
            ))}
          </div>

          <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
            <Lock className="h-3.5 w-3.5 text-green-600" />
            256-bit SSL encrypted · Please don&apos;t close or refresh this page.
          </p>
        </div>
      </div>
    </div>
  );
}
