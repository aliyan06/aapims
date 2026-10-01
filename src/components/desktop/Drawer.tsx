import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useDesktopOverlay } from "@/components/shell/desktop-overlay";
import { cn } from "@/lib/utils";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
};

/** Right-side detail drawer that anchors inside the desktop frame overlay host. */
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 520,
}: DrawerProps) {
  const host = useDesktopOverlay();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const content = (
    <div className="pointer-events-auto absolute inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 bg-primary-deep/40"
      />
      <div
        className="aa-slide-in-right relative flex h-full flex-col border-l border-border-soft bg-surface shadow-float"
        style={{ width }}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border-soft px-5 py-4">
          <div>
            <h2 className="text-[15px] font-bold text-text-dark">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-[12px] text-text-muted">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-muted hover:text-text-dark"
          >
            <X size={16} />
          </button>
        </header>
        <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-4")}>{children}</div>
        {footer ? (
          <footer className="border-t border-border-soft px-5 py-3.5">{footer}</footer>
        ) : null}
      </div>
    </div>
  );

  return host ? createPortal(content, host) : content;
}
