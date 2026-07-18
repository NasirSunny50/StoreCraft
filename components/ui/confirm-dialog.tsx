"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Reusable confirmation modal for destructive/irreversible actions. Controlled
 * via `open`; closes on backdrop click or Escape (unless `loading`). Compact,
 * centered layout — keep `title`/`description` short. The confirm button is
 * focused on open so a stray Enter doesn't hit anything unexpected.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  icon,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
  tone = "danger",
  testId,
}: {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  tone?: "danger" | "default";
  testId?: string;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onCancel();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-ink/50 p-4 backdrop-blur-sm"
      onClick={() => !loading && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-testid={testId}
    >
      <div
        className="w-[min(90vw,340px)] rounded-3xl bg-surface p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "confirm-pop .18s ease-out both" }}
      >
        <style>{`@keyframes confirm-pop{from{opacity:0;transform:translateY(8px) scale(.97)}to{opacity:1;transform:none}}`}</style>
        <span
          className={
            "mx-auto grid h-12 w-12 place-items-center rounded-2xl " +
            (tone === "danger" ? "bg-accent/10 text-accent" : "bg-surface-2 text-muted")
          }
        >
          {icon ?? <AlertTriangle className="h-6 w-6" />}
        </span>
        <h2 className="mt-3.5 text-lg font-bold text-ink">{title}</h2>
        {description && <div className="mt-1 text-sm text-muted">{description}</div>}
        <div className="mt-5 flex gap-2.5">
          <Button
            type="button"
            variant="soft"
            disabled={loading}
            onClick={onCancel}
            data-testid={testId ? `${testId}-cancel` : undefined}
            className="flex-1 rounded-xl"
          >
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            type="button"
            variant={tone === "danger" ? "accent" : "navy"}
            loading={loading}
            onClick={onConfirm}
            data-testid={testId ? `${testId}-confirm` : undefined}
            className="flex-1 rounded-xl"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
