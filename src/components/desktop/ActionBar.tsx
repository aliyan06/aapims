import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ActionBarProps = {
  children: ReactNode;
  className?: string;
};

/** Sticky footer action bar for wizard steps and detail screens. */
export function ActionBar({ children, className }: ActionBarProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-border-soft bg-surface/95 px-6 py-3.5 backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  );
}
