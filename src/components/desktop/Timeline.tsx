import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type TimelineStep = {
  label: string;
  state: "done" | "current" | "pending" | "error";
  timestamp?: string;
  by?: string;
  note?: string;
};

type TimelineProps = {
  steps: TimelineStep[];
  className?: string;
};

export function Timeline({ steps, className }: TimelineProps) {
  return (
    <ol className={cn("relative", className)}>
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        return (
          <li key={`${step.label}-${index}`} className="relative flex gap-3 pb-5 last:pb-0">
            {!last ? (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[11px] top-6 h-full w-px",
                  step.state === "done" ? "bg-status-cleared/50" : "bg-border-soft",
                )}
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2",
                step.state === "done" && "border-status-cleared bg-status-cleared text-white",
                step.state === "current" && "border-accent bg-info-soft text-accent",
                step.state === "pending" && "border-border-strong bg-surface text-text-subtle",
                step.state === "error" &&
                  "border-status-rejected bg-danger-soft text-status-rejected",
              )}
            >
              {step.state === "done" ? (
                <Check size={12} />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
              )}
            </span>
            <div className="min-w-0 pb-0.5">
              <div
                className={cn(
                  "text-[13px] font-semibold",
                  step.state === "pending" ? "text-text-muted" : "text-text-dark",
                )}
              >
                {step.label}
              </div>
              {step.timestamp || step.by ? (
                <div className="mt-0.5 text-[11px] text-text-subtle">
                  {[step.timestamp, step.by].filter(Boolean).join(" · ")}
                </div>
              ) : null}
              {step.note ? (
                <div className="mt-1 text-[12px] text-text-muted">{step.note}</div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
