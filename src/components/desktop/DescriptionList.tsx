import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DescriptionItem = {
  label: string;
  value: ReactNode;
  fullWidth?: boolean;
};

type DescriptionListProps = {
  items: DescriptionItem[];
  columns?: 1 | 2 | 3;
  className?: string;
};

const COLUMNS: Record<1 | 2 | 3, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
};

export function DescriptionList({ items, columns = 2, className }: DescriptionListProps) {
  return (
    <dl className={cn("grid gap-x-6 gap-y-3.5", COLUMNS[columns], className)}>
      {items.map((item) => (
        <div key={item.label} className={cn(item.fullWidth && "col-span-full")}>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-subtle">
            {item.label}
          </dt>
          <dd className="mt-0.5 text-[13px] font-medium text-text-dark">{item.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
