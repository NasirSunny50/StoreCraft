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
  price: string; // amount charged
  comparePrice: string; // regular (struck) price when on sale
  stock: number;
  lowStockAt: number;
  categoryId: string;
  brandId: string;
  isActive: boolean;
  isFeatured: boolean;
  warranty: string;
  colors: string[];
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

  // On sale → DB price=sale, comparePrice=regular. Else price=regular, no compare.
  const onSale = !!initial?.comparePrice;
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    regularPrice: (onSale ? initial?.comparePrice : initial?.price) ?? "",
    salePrice: onSale ? (initial?.price ?? "") : "",
    stock: initial?.stock?.toString() ?? "0",
    lowStockAt: initial?.lowStockAt?.toString() ?? "5",
    categoryId: initial?.categoryId ?? categories[0]?.id ?? "",
    brandId: initial?.brandId ?? "",
    isActive: initial?.isActive ?? true,
    isFeatured: initial?.isFeatured ?? false,
    warranty: initial?.warranty ?? "",
  });
  const [colors, setColors] = useState<string[]>(initial?.colors ?? []);
  const [colorInput, setColorInput] = useState("");
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>(initial?.specs ?? []);
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [uploading, setUploading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  const fe = (k: string) => fieldErrors[k]?.[0];

  function addColor() {
    const c = colorInput.trim();
    if (c && !colors.includes(c)) setColors((arr) => [...arr, c]);
    setColorInput("");
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Upload failed.");
          continue;
        }
        setImages((arr) => [...arr, data.url as string]);
      }
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    setError(null);
    setFieldErrors({});

    const regular = Number(form.regularPrice);
    const sale = form.salePrice.trim() ? Number(form.salePrice) : undefined;
    if (sale !== undefined && !(sale < regular)) {
      setError("Sale price must be less than the regular price.");
      return;
    }

    const input: ProductFormInput = {
      name: form.name,
      slug: form.slug || undefined,
      description: form.description,
      price: sale ?? regular, // amount charged
      comparePrice: sale !== undefined ? regular : undefined, // struck regular price
      stock: Number(form.stock),
      lowStockAt: Number(form.lowStockAt),
      categoryId: form.categoryId,
      brandId: form.brandId || undefined,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      warranty: form.warranty || undefined,
      colors,
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
        <Field label="Regular Price (৳)" error={fe("price")}>
          <input data-testid="pf-price" type="number" min={0} step="0.01" className={inputCls} value={form.regularPrice} onChange={(e) => set("regularPrice", e.target.value)} />
        </Field>
        <Field label="Sale Price (৳, optional)">
          <input data-testid="pf-sale-price" type="number" min={0} step="0.01" className={inputCls} value={form.salePrice} onChange={(e) => set("salePrice", e.target.value)} placeholder="leave blank if not on sale" />
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

      <Field label="Warranty (optional)">
        <input data-testid="pf-warranty" className={inputCls} value={form.warranty} onChange={(e) => set("warranty", e.target.value)} placeholder="e.g. 1 Year Official Warranty" />
      </Field>

      <div className="space-y-2 rounded border border-hairline bg-surface-2 p-3">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
          <span><strong>Active</strong> — visible and purchasable on the storefront. Uncheck to hide it (draft).</span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" data-testid="pf-featured" className="mt-1" checked={form.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} />
          <span><strong>Featured</strong> — highlighted in the homepage “Featured Products” section.</span>
        </label>
      </div>

      {/* Colors */}
      <div>
        <span className="mb-2 block text-sm font-medium">Color options (optional)</span>
        <div className="flex gap-2">
          <input
            className={inputCls}
            placeholder="e.g. Black"
            value={colorInput}
            data-testid="pf-color-input"
            onChange={(e) => setColorInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColor(); } }}
          />
          <Button type="button" variant="soft" size="sm" data-testid="pf-color-add" onClick={addColor}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
        {colors.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2" data-testid="pf-colors">
            {colors.map((c) => (
              <span key={c} className="inline-flex items-center gap-1 rounded border border-hairline-strong bg-surface px-2 py-1 text-xs">
                {c}
                <button type="button" aria-label={`Remove ${c}`} onClick={() => setColors((arr) => arr.filter((x) => x !== c))}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
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

      {/* Images — upload JPG/PNG */}
      <div>
        <span className="mb-2 block text-sm font-medium">Product Images (JPG / PNG)</span>
        <input
          type="file"
          accept="image/jpeg,image/png"
          multiple
          data-testid="pf-image-upload"
          onChange={(e) => handleFiles(e.target.files)}
          className="block text-sm"
        />
        {uploading && <p className="mt-1 text-xs text-muted">Uploading…</p>}
        {images.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-3" data-testid="pf-images">
            {images.map((url, i) => (
              <div key={i} className="relative h-20 w-20 overflow-hidden rounded border border-hairline">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button type="button" aria-label="Remove image" onClick={() => setImages((arr) => arr.filter((_, j) => j !== i))} className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-white/90 text-muted hover:text-accent"><X className="h-3 w-3" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="accent" disabled={pending || uploading} data-testid="pf-submit" onClick={submit}>
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
