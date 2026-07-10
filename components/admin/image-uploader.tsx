"use client";

import { useRef, useState } from "react";
import { ImagePlus, Star, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Modern multi-image uploader (drag & drop + click). The first image is the
 * "main" photo shown large; the rest sit beside it as thumbnails. Any thumbnail
 * can be promoted to main. Uploads go to /api/admin/upload (Cloudinary in prod).
 * Controlled: parent owns the `images` URL list.
 */
export function ImageUploader({
  images,
  onChange,
  onError,
  onUploadingChange,
  testId = "pf-images",
}: {
  images: string[];
  onChange: (images: string[]) => void;
  onError?: (msg: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
  testId?: string;
}) {
  const [uploading, setUploadingState] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function setUploading(v: boolean) {
    setUploadingState(v);
    onUploadingChange?.(v);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const added: string[] = [];
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          onError?.(data.error ?? "Upload failed.");
          continue;
        }
        added.push(data.url as string);
      }
      if (added.length) onChange([...images, ...added]);
    } finally {
      setUploading(false);
    }
  }

  function removeAt(i: number) {
    onChange(images.filter((_, j) => j !== i));
  }

  function makeMain(i: number) {
    const img = images[i];
    if (i === 0 || !img) return;
    onChange([img, ...images.filter((_, j) => j !== i)]);
  }

  const [main, ...rest] = images;

  return (
    <div className="space-y-3">
      {/* Dropzone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
          dragActive
            ? "border-accent bg-accent/5"
            : "border-hairline-strong hover:border-accent hover:bg-surface-2",
        )}
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-accent/10 text-accent">
          <ImagePlus className="h-5 w-5" />
        </span>
        <span className="text-sm font-medium text-ink">
          Drag &amp; drop images here, or <span className="text-accent">browse</span>
        </span>
        <span className="text-xs text-muted">JPG or PNG · you can add several at once</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          data-testid="pf-image-upload"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = ""; // allow re-selecting the same file
          }}
          className="hidden"
        />
      </div>

      {uploading && (
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
        </p>
      )}

      {images.length > 0 && (
        <div className="flex flex-wrap items-start gap-4" data-testid={testId}>
          {/* Main photo — larger, shown first */}
          <figure className="space-y-1">
            <div className="group relative h-32 w-32 overflow-hidden rounded-lg border border-hairline">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={main!} alt="Main product photo" className="h-full w-full object-cover" />
              <span className="absolute left-1 top-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                Main
              </span>
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => removeAt(0)}
                className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-white/90 text-muted hover:text-accent"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <figcaption className="text-center text-[11px] text-muted">Main photo</figcaption>
          </figure>

          {/* Additional photos — side by side */}
          {rest.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {rest.map((url, k) => {
                const i = k + 1;
                return (
                  <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-hairline">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      aria-label="Set as main photo"
                      title="Set as main"
                      onClick={() => makeMain(i)}
                      className="absolute left-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-white/90 text-muted opacity-0 transition-opacity hover:text-accent group-hover:opacity-100"
                    >
                      <Star className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      aria-label="Remove image"
                      onClick={() => removeAt(i)}
                      className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-white/90 text-muted hover:text-accent"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
