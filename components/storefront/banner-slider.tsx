"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Banner } from "@/lib/banners";

// Built-in gradient slides — shown only when the store owner hasn't uploaded
// any banners yet, so a fresh install never shows an empty hero.
const FALLBACK_SLIDES = [
  {
    eyebrow: "New Arrival",
    title: "MacBook Air M3",
    subtitle: "Featherlight power. 16GB RAM, all-day battery.",
    cta: "Shop Laptops",
    href: "/category/laptops",
    bg: "linear-gradient(120deg,#1b2533,#2d3e57)",
  },
  {
    eyebrow: "Best Seller",
    title: "Sony WH-1000XM5",
    subtitle: "Industry-leading noise cancellation.",
    cta: "Shop Audio",
    href: "/category/audio",
    bg: "linear-gradient(120deg,#3a1f1c,#7a2e26)",
  },
  {
    eyebrow: "Flagship",
    title: "iPhone 15 Pro",
    subtitle: "Titanium. A17 Pro. 48MP camera.",
    cta: "Shop Phones",
    href: "/category/smartphones",
    bg: "linear-gradient(120deg,#142033,#1f6fb2)",
  },
];

/** Number of slides to cycle, used to drive autoplay + dots regardless of mode. */
function useAutoplay(count: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(0);
  }, [count]);
  useEffect(() => {
    if (count <= 1) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((p) => (p + 1) % count), 5000);
    return () => clearInterval(t);
  }, [count]);
  return [i, setI] as const;
}

function Dots({ count, active, onPick }: { count: number; active: number; onPick: (i: number) => void }) {
  if (count <= 1) return null;
  return (
    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
      {Array.from({ length: count }).map((_, idx) => (
        <button
          key={idx}
          type="button"
          aria-label={`Slide ${idx + 1}`}
          onClick={() => onPick(idx)}
          className={`h-1.5 rounded-full transition-all ${idx === active ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
        />
      ))}
    </div>
  );
}

export function BannerSlider({ banners = [] }: { banners?: Banner[] }) {
  const useImages = banners.length > 0;
  const count = useImages ? banners.length : FALLBACK_SLIDES.length;
  const [i, setI] = useAutoplay(count);

  const frame = "relative h-full min-h-[260px] overflow-hidden rounded border border-hairline";

  if (useImages) {
    return (
      <div className={frame} data-testid="banner-slider">
        {banners.map((b, idx) => {
          const img = (
            // Full-bleed cover keeps any uploaded size sitting right in the frame.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.imageUrl} alt="" className="h-full w-full object-cover" />
          );
          return (
            <div
              key={idx}
              className="absolute inset-0 transition-opacity duration-700"
              style={{ opacity: idx === i ? 1 : 0 }}
              aria-hidden={idx !== i}
            >
              {b.href ? (
                <Link href={b.href} className="block h-full w-full" tabIndex={idx === i ? 0 : -1}>
                  {img}
                </Link>
              ) : (
                img
              )}
            </div>
          );
        })}
        <Dots count={count} active={i} onPick={setI} />
      </div>
    );
  }

  return (
    <div className={frame} data-testid="banner-slider">
      {FALLBACK_SLIDES.map((s, idx) => (
        <div
          key={idx}
          className="absolute inset-0 flex flex-col justify-center px-8 text-white transition-opacity duration-700"
          style={{ background: s.bg, opacity: idx === i ? 1 : 0 }}
          aria-hidden={idx !== i}
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-white/70">{s.eyebrow}</span>
          <h2 className="mt-2 text-3xl font-extrabold md:text-4xl">{s.title}</h2>
          <p className="mt-2 max-w-sm text-sm text-white/80">{s.subtitle}</p>
          <Link
            href={s.href}
            className="mt-5 inline-flex w-fit items-center gap-1.5 rounded bg-accent px-4 py-2 text-sm font-semibold hover:bg-accent-strong"
          >
            {s.cta} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ))}
      <Dots count={count} active={i} onPick={setI} />
    </div>
  );
}
