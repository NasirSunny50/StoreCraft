"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createProduct, updateProduct } from "@/lib/actions/admin-product";
import type { ProductFormInput } from "@/lib/validators/product-admin";
import { Button } from "@/components/ui/button";

type Option = { id: string; name: string };

export type ProductFormInitial = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  comparePrice: string;
  stock: number;
  lowStockAt: number;
  categoryId: string;
  brandId: string;
  isActive: boolean;
  isFeatured: boolean;
  specs: { key: string; value: string }[];
  images: string[];
};

const inputCls =
  "w-full rounded border border-hairline-strong px-3 py-2 text-sm outline-none focus:border-accent";

export function ProductForm({
  mode,
  categories,
  brands,
  initial,
}: {
  mode: "create" | "edit";
  categories: Option[];
  brands: Option[];
  initial?: ProductFormInitial;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    price: initial?.price ?? "",
    comparePrice: initial?.comparePrice ?? "",
    stock: initial?.stock?.toString() ?? "0",
    lowStockAt: initial?.lowStockAt?.toString() ?? "5",
    categoryId: initial?.categoryId ?? categories[0]?.id ?? "",
    brandId: initial?.brandId ?? "",
    isActive: initial?.isActive ?? true,
    isFeatured: initial?.isFeatured ?? false,
  });
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>(
    initial?.specs ?? [],
  );
  const [images, setImages] = useState<string[]>(initial?.images ?? []);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  const fe = (k: string) => fieldErrors[k]?.[0];

  function submit() {
    setError(null);
    setFieldErrors({});
    const input: ProductFormInput = {
      name: form.name,
      slug: form.slug || undefined,
      description: form.description,
      price: Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
      stock: Number(form.stock),
      lowStockAt: Number(form.lowStockAt),
      categoryId: form.categoryId,
      brandId: form.brandId || undefined,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      specs: specs.filter((s) => s.key.trim() && s.value.trim()),
      images: images.map((u) => u.trim()).filter(Boolean),
    };
    startTransition(async () => {
      const res =
        mode === "edit" && initial
          ? await updateProduct(initial.id, input)
          : await createProduct(input);
      if (res.ok) {
        router.push("/admin/products");
        router.refresh();
      } else {
        setError(res.error ?? "Please fix the errors below.");
        setFieldErrors(res.fieldErrors ?? {});
      }
    });
  }

  return (
    <div className="max-w-3xl space-y-5" data-testid="product-form">
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-accent">{error}</p>}

      <Field label="Name" error={fe("name")}>
        <input data-testid="pf-name" className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} />
      </Field>

      <Field label="Slug (optional — auto-generated)" error={fe("slug")}>
        <input className={inputCls} value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto" />
      </Field>

      <Field label="Description" error={fe("description")}>
        <textarea data-testid="pf-description" rows={3} className={inputCls} value={form.description} onChange={(e) => set("description", e.target.value)} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Price (৳)" error={fe("price")}>
          <input data-testid="pf-price" type="number" min={0} step="0.01" className={inputCls} value={form.price} onChange={(e) => set("price", e.target.value)} />
        </Field>
        <Field label="Compare price (৳, optional)" error={fe("comparePrice")}>
          <input type="number" min={0} step="0.01" className={inputCls} value={form.comparePrice} onChange={(e) => set("comparePrice", e.target.value)} />
        </Field>
        <Field label="Stock" error={fe("stock")}>
          <input data-testid="pf-stock" type="number" min={0} className={inputCls} value={form.stock} onChange={(e) => set("stock", e.target.value)} />
        </Field>
        <Field label="Low-stock threshold" error={fe("lowStockAt")}>
          <input type="number" min={0} className={inputCls} value={form.lowStockAt} onChange={(e) => set("lowStockAt", e.target.value)} />
        </Field>
        <Field label="Category" error={fe("categoryId")}>
          <select data-testid="pf-category" className={inputCls} value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Brand (optional)" error={fe("brandId")}>
          <select className={inputCls} value={form.brandId} onChange={(e) => set("brandId", e.target.value)}>
            <option value="">— None —</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </Field>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} /> Active
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" data-testid="pf-featured" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} /> Featured
        </label>
      </div>

      {/* Specs */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Specifications</span>
          <Button type="button" variant="soft" size="sm" onClick={() => setSpecs((s) => [...s, { key: "", value: "" }])}>
            <Plus className="h-3.5 w-3.5" /> Add spec
          </Button>
        </div>
        <div className="space-y-2">
          {specs.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input className={inputCls} placeholder="Key (e.g. RAM)" value={s.key} onChange={(e) => setSpecs((arr) => arr.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))} />
              <input className={inputCls} placeholder="Value (e.g. 16GB)" value={s.value} onChange={(e) => setSpecs((arr) => arr.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
              <button type="button" aria-label="Remove spec" onClick={() => setSpecs((arr) => arr.filter((_, j) => j !== i))} className="px-2 text-muted hover:text-accent"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Images */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Image URLs</span>
          <Button type="button" variant="soft" size="sm" onClick={() => setImages((a) => [...a, ""])}>
            <Plus className="h-3.5 w-3.5" /> Add image
          </Button>
        </div>
        <div className="space-y-2">
          {images.map((url, i) => (
            <div key={i} className="flex gap-2">
              <input className={inputCls} placeholder="https://…" value={url} onChange={(e) => setImages((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))} />
              <button type="button" aria-label="Remove image" onClick={() => setImages((arr) => arr.filter((_, j) => j !== i))} className="px-2 text-muted hover:text-accent"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted">Paste image URLs (Cloudinary upload widget arrives in Phase 5).</p>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="accent" disabled={pending} data-testid="pf-submit" onClick={submit}>
          {pending ? "Saving…" : mode === "edit" ? "Save changes" : "Create product"}
        </Button>
        <Button type="button" variant="soft" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-ink">{label}</label>
      {children}
      {error && <p className="text-xs text-accent">{error}</p>}
    </div>
  );
}
