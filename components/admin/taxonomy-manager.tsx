"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCategory,
  renameCategory,
  deleteCategory,
  createBrand,
  renameBrand,
  deleteBrand,
  type ActionResult,
} from "@/lib/actions/admin-catalog";
import { Button } from "@/components/ui/button";

type Item = { id: string; name: string; slug: string; productCount: number };

const FNS = {
  category: { create: createCategory, rename: renameCategory, remove: deleteCategory },
  brand: { create: createBrand, rename: renameBrand, remove: deleteBrand },
};

export function TaxonomyManager({
  kind,
  items,
}: {
  kind: "category" | "brand";
  items: Item[];
}) {
  const router = useRouter();
  const fns = FNS[kind];
  const [pending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function run(p: Promise<ActionResult>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      const res = await p;
      if (!res.ok) setError(res.error ?? "Something went wrong.");
      else {
        after?.();
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={`New ${kind} name`}
          data-testid="taxonomy-new-name"
          className="w-64 rounded border border-hairline-strong px-3 py-2 text-sm"
        />
        <Button
          variant="accent"
          size="sm"
          disabled={pending || !newName.trim()}
          data-testid="taxonomy-add"
          onClick={() => run(fns.create(newName), () => setNewName(""))}
        >
          Add
        </Button>
      </div>

      {error && <p className="text-sm text-accent" data-testid="taxonomy-error">{error}</p>}

      <div className="overflow-hidden rounded border border-hairline">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Slug</th>
              <th className="px-3 py-2 font-medium">Products</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {items.map((item) => (
              <Row key={item.id} item={item} pending={pending} onRename={(name) => run(fns.rename(item.id, name))} onDelete={() => run(fns.remove(item.id))} />
            ))}
            {items.length === 0 && (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-muted">None yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({
  item,
  pending,
  onRename,
  onDelete,
}: {
  item: Item;
  pending: boolean;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(item.name);
  return (
    <tr data-testid="taxonomy-row" data-slug={item.slug} className="bg-surface">
      <td className="px-3 py-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border border-hairline px-2 py-1"
        />
      </td>
      <td className="px-3 py-2 text-muted">{item.slug}</td>
      <td className="px-3 py-2 text-muted">{item.productCount}</td>
      <td className="px-3 py-2 text-right">
        <div className="flex justify-end gap-2">
          {name.trim() !== item.name && (
            <Button variant="soft" size="sm" disabled={pending} onClick={() => onRename(name)}>
              Save
            </Button>
          )}
          <Button variant="outline" size="sm" disabled={pending} data-testid="taxonomy-delete" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}
