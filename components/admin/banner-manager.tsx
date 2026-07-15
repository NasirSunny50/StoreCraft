"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Trash2, ChevronUp, ChevronDown, Upload } from "lucide-react";
import { updateBanners } from "@/lib/actions/admin-banners";
import {
  type Banner,
  type BannerSet,
  BANNER_ASPECT,
  BANNER_RECOMMENDED,
  SIDE_BANNER_ASPECT,
  SIDE_BANNER_RECOMMENDED,
} from "@/lib/banners";
import { Button } from "@/components/ui/button";

/** Upload a file to the shared admin endpoint, returning its URL (or throwing). */
async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload failed.");
  return data.url as string;
}

export function BannerManager({ initial }: { initial: BannerSet }) {
  const router = useRouter();
  const [set, setSet] = useState<BannerSet>(initial);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function update(patch: Partial<BannerSet>) {
    setSet((prev) => ({ ...prev, ...patch }));
    setMsg(null);
  }

  // ----- main slider list -----
  function addMain() {
    update({ main: [...set.main, { imageUrl: "", href: "" }] });
  }
  function removeMain(i: number) {
    update({ main: set.main.filter((_, j) => j !== i) });
  }
  function setMainField(i: number, p: Partial<Banner>) {
    update({ main: set.main.map((b, j) => (j === i ? { ...b, ...p } : b)) });
  }
  function moveMain(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= set.main.length) return;
    const next = [...set.main];
    [next[i], next[j]] = [next[j]!, next[i]!];
    update({ main: next });
  }

  function save() {
    setMsg(null);
    // Drop main rows that never got an image; side slots keep null when empty.
    const clean: BannerSet = {
      main: set.main.filter((b) => b.imageUrl.trim() !== ""),
      sideTop: set.sideTop?.imageUrl.trim() ? set.sideTop : null,
      sideBottom: set.sideBottom?.imageUrl.trim() ? set.sideBottom : null,
    };
    startTransition(async () => {
      const res = await updateBanners(clean);
      if (!res.ok) setMsg({ type: "err", text: res.error ?? "Failed." });
      else {
        setSet(clean);
        setMsg({ type: "ok", text: "Banners saved." });
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Layout guide so admins know which upload maps to which spot on the page. */}
      <div className="rounded-lg border border-hairline bg-surface-2 p-3">
        <p className="mb-2 text-xs font-semibold text-ink">Where these show on the homepage</p>
        <div className="flex max-w-md gap-2">
          <div className="flex flex-1 items-center justify-center rounded border-2 border-accent bg-accent/5 py-6 text-[11px] font-semibold text-accent">
            Main slider
          </div>
          <div className="flex w-24 flex-col gap-2">
            <div className="flex flex-1 items-center justify-center rounded border-2 border-hairline-strong py-2 text-[10px] font-semibold text-muted">
              Side top
            </div>
            <div className="flex flex-1 items-center justify-center rounded border-2 border-hairline-strong py-2 text-[10px] font-semibold text-muted">
              Side bottom
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Main slider (rotating, many) ---------- */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-bold text-ink">Main slider (rotating)</h2>
          <p className="text-xs text-muted">
            The large hero on the left. Add several images and they rotate. Recommended{" "}
            <strong className="text-ink">{BANNER_RECOMMENDED}</strong> (3:1). Images are centred and
            cropped to fit — <strong className="text-ink">Banner 1</strong> shows first; reorder with
            the arrows.
          </p>
        </div>

        {set.main.length === 0 && (
          <div className="rounded-lg border border-dashed border-hairline-strong p-6 text-center text-xs text-muted">
            No slider images — the storefront shows the built-in gradient slides until you add one.
          </div>
        )}

        <div className="space-y-3">
          {set.main.map((b, i) => (
            <BannerRow
              key={i}
              index={i}
              total={set.main.length}
              banner={b}
              aspect={BANNER_ASPECT}
              onUploaded={(url) => setMainField(i, { imageUrl: url })}
              onHref={(href) => setMainField(i, { href })}
              onRemove={() => removeMain(i)}
              onMove={(dir) => moveMain(i, dir)}
              onBusy={setBusy}
              onError={(text) => setMsg({ type: "err", text })}
            />
          ))}
        </div>

        <Button variant="outline" onClick={addMain} disabled={pending} data-testid="banner-add">
          <ImagePlus className="h-4 w-4" /> Add slider image
        </Button>
      </section>

      {/* ---------- Side promos (one each) ---------- */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-bold text-ink">Side banners</h2>
          <p className="text-xs text-muted">
            The two small boxes on the right — one image each. Recommended{" "}
            <strong className="text-ink">{SIDE_BANNER_RECOMMENDED}</strong> (16:9). Left empty, each
            falls back to its built-in promo box.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <SideBanner
            label="Side top"
            banner={set.sideTop}
            aspect={SIDE_BANNER_ASPECT}
            testId="side-top"
            onChange={(b) => update({ sideTop: b })}
            onBusy={setBusy}
            onError={(text) => setMsg({ type: "err", text })}
          />
          <SideBanner
            label="Side bottom"
            banner={set.sideBottom}
            aspect={SIDE_BANNER_ASPECT}
            testId="side-bottom"
            onChange={(b) => update({ sideBottom: b })}
            onBusy={setBusy}
            onError={(text) => setMsg({ type: "err", text })}
          />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-4">
        <Button variant="accent" onClick={save} disabled={pending || busy} data-testid="banner-save">
          {pending ? "Saving…" : "Save banners"}
        </Button>
        {msg && (
          <span className={msg.type === "ok" ? "text-xs text-green-700" : "text-xs text-accent"} data-testid="banner-msg">
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}

/** Preview frame + upload/link controls shared by both banner kinds. */
function Preview({
  imageUrl,
  aspect,
  uploading,
  placeholder,
}: {
  imageUrl: string;
  aspect: string;
  uploading: boolean;
  placeholder: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-md border border-hairline bg-surface-2"
      style={{ aspectRatio: aspect }}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center px-2 text-center text-xs text-muted">{placeholder}</div>
      )}
      {uploading && (
        <div className="absolute inset-0 grid place-items-center bg-white/60">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
        </div>
      )}
    </div>
  );
}

function UploadButton({
  hasImage,
  onFile,
  testId,
}: {
  hasImage: boolean;
  onFile: (file: File | undefined) => void;
  testId: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <label className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-md border border-hairline-strong bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent">
      <Upload className="h-3.5 w-3.5" />
      {hasImage ? "Replace image" : "Upload image"}
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png"
        data-testid={testId}
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
        className="hidden"
      />
    </label>
  );
}

function HrefInput({ value, onChange, testId }: { value: string; onChange: (v: string) => void; testId: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold text-ink">Link (optional)</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="/category/audio"
        data-testid={testId}
        className="w-full rounded border border-hairline-strong px-2.5 py-1.5 text-xs focus:border-accent focus:outline-none"
      />
      <span className="mt-1 block text-[10px] text-muted">Where it links on click. Blank = not clickable.</span>
    </label>
  );
}

// ---------- main slider row ----------
function BannerRow({
  index,
  total,
  banner,
  aspect,
  onUploaded,
  onHref,
  onRemove,
  onMove,
  onBusy,
  onError,
}: {
  index: number;
  total: number;
  banner: Banner;
  aspect: string;
  onUploaded: (url: string) => void;
  onHref: (href: string) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onBusy: (v: boolean) => void;
  onError: (text: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handle(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    onBusy(true);
    try {
      onUploaded(await uploadImage(file));
    } catch (e) {
      onError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      onBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-hairline bg-surface p-3" data-testid="banner-row">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-6 min-w-6 place-items-center rounded-full bg-accent px-2 text-xs font-bold text-white">
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-ink">Banner {index + 1}</span>
          {index === 0 && (
            <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-green-700">
              Shows first
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Move up"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            className="grid h-7 w-7 place-items-center rounded border border-hairline-strong text-muted hover:text-accent disabled:opacity-30"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Move down"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            className="grid h-7 w-7 place-items-center rounded border border-hairline-strong text-muted hover:text-accent disabled:opacity-30"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Remove banner"
            onClick={onRemove}
            data-testid="banner-remove"
            className="grid h-7 w-7 place-items-center rounded border border-hairline-strong text-muted hover:border-accent hover:text-accent"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <Preview imageUrl={banner.imageUrl} aspect={aspect} uploading={uploading} placeholder="No image — upload to preview" />
        <div className="flex flex-col gap-2">
          <UploadButton hasImage={!!banner.imageUrl} onFile={handle} testId="banner-upload" />
          <HrefInput value={banner.href} onChange={onHref} testId="banner-href" />
        </div>
      </div>
    </div>
  );
}

// ---------- single side banner ----------
function SideBanner({
  label,
  banner,
  aspect,
  testId,
  onChange,
  onBusy,
  onError,
}: {
  label: string;
  banner: Banner | null;
  aspect: string;
  testId: string;
  onChange: (b: Banner | null) => void;
  onBusy: (v: boolean) => void;
  onError: (text: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const current = banner ?? { imageUrl: "", href: "" };

  async function handle(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    onBusy(true);
    try {
      onChange({ ...current, imageUrl: await uploadImage(file) });
    } catch (e) {
      onError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      onBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-hairline bg-surface p-3" data-testid={`side-${testId}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">{label}</span>
        {banner && (
          <button
            type="button"
            aria-label={`Remove ${label}`}
            onClick={() => onChange(null)}
            data-testid={`${testId}-remove`}
            className="grid h-7 w-7 place-items-center rounded border border-hairline-strong text-muted hover:border-accent hover:text-accent"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="space-y-2">
        <Preview imageUrl={current.imageUrl} aspect={aspect} uploading={uploading} placeholder="Empty — uses built-in promo" />
        <UploadButton hasImage={!!current.imageUrl} onFile={handle} testId={`${testId}-upload`} />
        <HrefInput value={current.href} onChange={(href) => onChange({ ...current, href })} testId={`${testId}-href`} />
      </div>
    </div>
  );
}
