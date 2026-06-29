"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

type GalleryImage = { url: string; alt: string | null };

export function ProductGallery({
  images,
  name,
}: {
  images: GalleryImage[];
  name: string;
}) {
  const [idx, setIdx] = useState(0);

  if (images.length === 0) {
    return (
      <div className="grid aspect-square place-items-center rounded border border-hairline bg-white">
        <span className="meta-label">No image</span>
      </div>
    );
  }

  const main = images[Math.min(idx, images.length - 1)]!;

  return (
    <div className="space-y-3">
      <div
        data-testid="gallery-main"
        className="grid aspect-square place-items-center rounded border border-hairline bg-white p-6"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={main.url}
          alt={main.alt ?? name}
          className="max-h-full max-w-full object-contain"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((im, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`View image ${i + 1}`}
              className={cn(
                "grid h-16 w-16 place-items-center rounded border bg-white p-1.5",
                i === idx ? "border-accent" : "border-hairline hover:border-hairline-strong",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={im.url}
                alt={im.alt ?? `${name} ${i + 1}`}
                className="max-h-full max-w-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
