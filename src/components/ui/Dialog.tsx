import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

export function Dialog({ open, onClose, title, description, children, footer, width = "max-w-md" }: DialogProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-dialog",
          width
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold leading-tight text-foreground">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-2 py-2">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
