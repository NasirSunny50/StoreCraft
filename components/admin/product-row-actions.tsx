"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { softDeleteProduct, restoreProduct } from "@/lib/actions/admin-product";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function ProductRowActions({
  id,
  name,
  isDeleted,
}: {
  id: string;
  name?: string;
  isDeleted: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Restore is non-destructive → run immediately. Delete asks for confirmation
  // first, since it hides the product from the store.
  function restore() {
    startTransition(async () => {
      await restoreProduct(id);
      router.refresh();
    });
  }

  function confirmDelete() {
    startTransition(async () => {
      await softDeleteProduct(id);
      router.refresh();
      setConfirmOpen(false);
    });
  }

  return (
    <div className="flex justify-end gap-2">
      <Link
        href={`/admin/products/${id}/edit`}
        className="rounded border border-hairline-strong px-2.5 py-1 text-xs hover:bg-surface-2"
      >
        Edit
      </Link>
      {isDeleted ? (
        <Button
          variant="soft"
          size="sm"
          disabled={pending}
          data-testid="product-toggle-delete"
          onClick={restore}
        >
          Restore
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          data-testid="product-toggle-delete"
          onClick={() => setConfirmOpen(true)}
        >
          Delete
        </Button>
      )}

      <ConfirmDialog
        open={confirmOpen}
        icon={<Trash2 className="h-6 w-6" />}
        title="Delete product?"
        description={
          name ? (
            <>
              <span className="font-medium text-ink">{name}</span> · you can restore it later.
            </>
          ) : (
            "You can restore it later."
          )
        }
        confirmLabel={pending ? "Deleting…" : "Delete"}
        cancelLabel="Cancel"
        loading={pending}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
        testId="product-delete-confirm"
      />
    </div>
  );
}
