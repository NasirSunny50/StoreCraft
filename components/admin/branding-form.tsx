"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { updateBranding } from "@/lib/actions/admin-branding";
import type { Branding } from "@/lib/branding";
import { Button } from "@/components/ui/button";

const inputCls =
  "w-full rounded border border-hairline-strong px-3 py-2 text-sm focus:border-accent focus:outline-none";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

export function BrandingForm({ initial }: { initial: Branding }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [b, setB] = useState<Branding>(initial);
  const [uploading, setUploading] = useState<null | "logoUrl" | "faviconUrl">(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function set<K extends keyof Branding>(k: K, v: Branding[K]) {
    setB((prev) => ({ ...prev, [k]: v }));
  }

  async function upload(field: "logoUrl" | "faviconUrl", file: File | undefined) {
    if (!file) return;
    setMsg(null);
    setUploading(field);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) setMsg({ type: "err", text: data.error ?? "Upload failed." });
      else set(field, data.url as string);
    } catch {
      setMsg({ type: "err", text: "Upload failed." });
    } finally {
      setUploading(null);
    }
  }

  function save() {
    setMsg(null);
    startTransition(async () => {
      const res = await updateBranding(b);
      if (!res.ok) setMsg({ type: "err", text: res.error ?? "Failed." });
      else {
        setMsg({ type: "ok", text: "Branding saved." });
        router.refresh();
      }
    });
  }

  function ImageField({
    field,
    label,
    hint,
  }: {
    field: "logoUrl" | "faviconUrl";
    label: string;
    hint: string;
  }) {
    return (
      <Field label={label} hint={hint}>
        <div className="flex items-center gap-3 rounded-lg border border-hairline bg-surface-2 p-3">
          {b[field] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={b[field]}
              alt={label}
              className="h-14 w-14 shrink-0 rounded-md border border-hairline bg-surface object-contain p-1"
            />
          ) : (
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-md border border-dashed border-hairline-strong text-[10px] text-muted">
              none
            </div>
          )}
          <div className="flex min-w-0 flex-col gap-1.5 border-l border-hairline pl-3">
            <label className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-md border border-hairline-strong bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent">
              <Upload className="h-3.5 w-3.5" />
              {b[field] ? "Replace image" : "Choose image"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={(e) => upload(field, e.target.files?.[0])}
                className="hidden"
              />
            </label>
            <span className="text-[11px]">
              {uploading === field ? (
                <span className="text-muted">Uploading…</span>
              ) : b[field] ? (
                <button
                  type="button"
                  onClick={() => set(field, "")}
                  className="text-accent hover:underline"
                >
                  Remove
                </button>
              ) : (
                <span className="text-muted">No file chosen · PNG, JPG or SVG</span>
              )}
            </span>
          </div>
        </div>
      </Field>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded border border-hairline bg-surface p-4">
        <h2 className="text-sm font-bold text-ink">Identity</h2>
        <Field label="Shop name" hint="Shown in the header, footer, emails and browser tab.">
          <input
            value={b.shopName}
            onChange={(e) => set("shopName", e.target.value)}
            className={inputCls}
            data-testid="branding-shopname"
          />
        </Field>
        <ImageField field="logoUrl" label="Logo" hint="Replaces the text wordmark in the header/footer. PNG/SVG with transparent background works best." />
        <ImageField field="faviconUrl" label="Favicon" hint="Browser-tab icon. Square image (e.g. 64×64). Falls back to the logo when empty." />
      </section>

      <section className="space-y-4 rounded border border-hairline bg-surface p-4">
        <h2 className="text-sm font-bold text-ink">SEO</h2>
        <Field label="Tagline" hint="Short line used next to the shop name.">
          <input value={b.tagline} onChange={(e) => set("tagline", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Meta title" hint="Browser tab / search title. Empty → “Shop name — Tagline”.">
          <input value={b.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Meta description" hint="Search & social preview description.">
          <textarea value={b.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} rows={2} className={inputCls} />
        </Field>
      </section>

      <section className="space-y-4 rounded border border-hairline bg-surface p-4">
        <h2 className="text-sm font-bold text-ink">Contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hotline">
            <input value={b.hotline} onChange={(e) => set("hotline", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Contact email">
            <input value={b.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className={inputCls} />
          </Field>
        </div>
        <Field label="Address">
          <input value={b.address} onChange={(e) => set("address", e.target.value)} className={inputCls} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Facebook URL">
            <input value={b.facebook} onChange={(e) => set("facebook", e.target.value)} className={inputCls} placeholder="https://…" />
          </Field>
          <Field label="Instagram URL">
            <input value={b.instagram} onChange={(e) => set("instagram", e.target.value)} className={inputCls} placeholder="https://…" />
          </Field>
          <Field label="WhatsApp URL">
            <input value={b.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} className={inputCls} placeholder="https://…" />
          </Field>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button variant="accent" onClick={save} disabled={pending || !!uploading} data-testid="branding-save">
          {pending ? "Saving…" : "Save branding"}
        </Button>
        {msg && (
          <span className={msg.type === "ok" ? "text-xs text-green-700" : "text-xs text-accent"}>
            {msg.text}
          </span>
        )}
      </div>
    </div>
  );
}
