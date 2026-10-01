import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  children: ReactNode;
  hint?: string;
  required?: boolean;
  className?: string;
};

export function Field({ label, children, hint, required, className }: FieldProps) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-text-dark">
        {label}
        {required ? <span className="text-status-rejected">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-text-subtle">{hint}</span> : null}
    </label>
  );
}
