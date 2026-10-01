import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type StepIndicatorProps = {
  steps: readonly string[];
  current: number;
  onStepClick?: (index: number) => void;
};

export function StepIndicator({ steps, current, onStepClick }: StepIndicatorProps) {
  return (
    <ol className="flex items-center gap-1.5" aria-label="Application steps">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        const clickable = typeof onStepClick === "function" && index <= current;
        return (
          <li key={step} className="flex min-w-0 flex-1 items-center gap-1.5">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick?.(index)}
              className={cn(
                "flex min-w-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors",
                clickable ? "cursor-pointer hover:bg-surface-muted" : "cursor-default",
                active && "bg-info-soft",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                  done
                    ? "bg-status-cleared text-white"
                    : active
                      ? "bg-accent text-accent-foreground"
                      : "bg-surface-muted text-text-subtle",
                )}
              >
                {done ? <Check size={13} /> : index + 1}
              </span>
              <span
                className={cn(
                  "truncate text-[12px] font-semibold",
                  active ? "text-accent" : done ? "text-text-dark" : "text-text-subtle",
                )}
              >
                {step}
              </span>
            </button>
            {index < steps.length - 1 ? <span className="h-px flex-1 bg-border-soft" /> : null}
          </li>
        );
      })}
    </ol>
  );
}
