"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCoupon,
  toggleCoupon,
  deleteCoupon,
} from "@/lib/actions/admin-coupon";
import { Button } from "@/components/ui/button";

export type CouponView = {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: string;
  minOrder: string;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
};

const inputCls = "rounded border border-hairline-strong px-2 py-1.5 text-sm";

export function CouponManager({ coupons }: { coupons: CouponView[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    type: "PERCENT",
    value: "",
    minOrder: "0",
    usageLimit: "",
    expiresAt: "",
  });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function create() {
    setError(null);
    startTransition(async () => {
      const res = await createCoupon({
        code: form.code,
        type: form.type,
        value: form.value,
        minOrder: form.minOrder,
        usageLimit: form.usageLimit || undefined,
        expiresAt: form.expiresAt || undefined,
        isActive: true,
      });
      if (!res.ok) {
        setError(res.error ?? Object.values(res.fieldErrors ?? {})[0]?.[0] ?? "Invalid coupon.");
      } else {
        setForm({ code: "", type: "PERCENT", value: "", minOrder: "0", usageLimit: "", expiresAt: "" });
        router.refresh();
      }
    });
  }

  function act(p: Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await p;
      if (!res.ok) setError(res.error ?? "Failed.");
      else router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded border border-hairline bg-surface p-4">
        <h2 className="mb-3 text-sm font-bold">New Coupon</h2>
        <div className="flex flex-wrap items-end gap-2">
          <input className={`${inputCls} w-32 uppercase`} placeholder="CODE" value={form.code} onChange={(e) => set("code", e.target.value)} data-testid="coupon-code" />
          <select className={inputCls} value={form.type} onChange={(e) => set("type", e.target.value)} data-testid="coupon-type">
            <option value="PERCENT">Percent %</option>
            <option value="FIXED">Fixed ৳</option>
          </select>
          <input className={`${inputCls} w-24`} type="number" placeholder="Value" value={form.value} onChange={(e) => set("value", e.target.value)} data-testid="coupon-value" />
          <input className={`${inputCls} w-28`} type="number" placeholder="Min order" value={form.minOrder} onChange={(e) => set("minOrder", e.target.value)} data-testid="coupon-min" />
          <input className={`${inputCls} w-24`} type="number" placeholder="Limit" value={form.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} data-testid="coupon-limit" />
          <input className={inputCls} type="date" value={form.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} data-testid="coupon-expiry" />
          <Button variant="accent" size="sm" disabled={pending || !form.code || !form.value} data-testid="coupon-create" onClick={create}>
            Create
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-accent" data-testid="coupon-form-error">{error}</p>}
      </div>

      <div className="overflow-hidden rounded border border-hairline">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Code</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Value</th>
              <th className="px-3 py-2 font-medium">Min</th>
              <th className="px-3 py-2 font-medium">Usage</th>
              <th className="px-3 py-2 font-medium">Expires</th>
              <th className="px-3 py-2 font-medium">Active</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {coupons.map((c) => (
              <tr key={c.id} data-testid="coupon-row" data-code={c.code} className="bg-surface">
                <td className="px-3 py-2 font-semibold">{c.code}</td>
                <td className="px-3 py-2 text-muted">{c.type}</td>
                <td className="px-3 py-2">{c.type === "PERCENT" ? `${c.value}%` : `৳${c.value}`}</td>
                <td className="px-3 py-2 text-muted">৳{c.minOrder}</td>
                <td className="px-3 py-2 text-muted">{c.usedCount}{c.usageLimit != null ? ` / ${c.usageLimit}` : ""}</td>
                <td className="px-3 py-2 text-muted">{c.expiresAt ?? "—"}</td>
                <td className="px-3 py-2">
                  <span className={c.isActive ? "text-green-700" : "text-muted"}>{c.isActive ? "Yes" : "No"}</span>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="soft" size="sm" disabled={pending} onClick={() => act(toggleCoupon(c.id, !c.isActive))}>
                      {c.isActive ? "Disable" : "Enable"}
                    </Button>
                    <Button variant="outline" size="sm" disabled={pending} data-testid="coupon-delete" onClick={() => act(deleteCoupon(c.id))}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-muted">No coupons yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
