import { Check, CircleAlert, CircleX } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChecklistItem = {
  id: string;
  label: string;
  detail?: string;
  outcome?: "PASS" | "WARNING" | "BLOCKER";
  done?: boolean;
};

type ChecklistProps = {
  items: ChecklistItem[];
  className?: string;
};

const ICON = {
  PASS: { Icon: Check, className: "bg-success-soft text-status-cleared" },
  WARNING: { Icon: CircleAlert, className: "bg-warning-soft text-status-awaiting" },
  BLOCKER: { Icon: CircleX, className: "bg-danger-soft text-status-rejected" },
} as const;

export function Checklist({ items, className }: ChecklistProps) {
  return (
    <ul className={cn("space-y-1.5", className)}>
      {items.map((item) => {
        const tone = item.outcome ?? (item.done ? "PASS" : "WARNING");
        const { Icon, className: toneClass } = ICON[tone];
        return (
          <li
            key={item.id}
            className="flex items-start gap-3 rounded-lg border border-border-soft bg-surface px-3.5 py-2.5"
          >
            <span
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                toneClass,
              )}
            >
              <Icon size={13} />
            </span>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-text-dark">{item.label}</div>
              {item.detail ? (
                <div className="text-[12px] text-text-muted">{item.detail}</div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
