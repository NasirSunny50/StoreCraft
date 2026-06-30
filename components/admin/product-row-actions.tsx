"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { softDeleteProduct, restoreProduct } from "@/lib/actions/admin-product";
import { Button } from "@/components/ui/button";

export function ProductRowActions({
  id,
  isDeleted,
}: {
  id: string;
  isDeleted: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await (isDeleted ? restoreProduct(id) : softDeleteProduct(id));
      router.refresh();
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
      <Button
        variant={isDeleted ? "soft" : "outline"}
        size="sm"
        disabled={pending}
        data-testid="product-toggle-delete"
        onClick={toggle}
      >
        {isDeleted ? "Restore" : "Delete"}
      </Button>
    </div>
  );
}
