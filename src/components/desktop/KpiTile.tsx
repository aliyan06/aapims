import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type KpiTileProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  tone?: "default" | "info" | "warning" | "success" | "danger" | "revision";
  onClick?: () => void;
};

const TONE: Record<NonNullable<KpiTileProps["tone"]>, string> = {
  default: "bg-surface-muted text-primary",
  info: "bg-info-soft text-accent",
  warning: "bg-warning-soft text-status-awaiting",
  success: "bg-success-soft text-status-cleared",
  danger: "bg-danger-soft text-status-rejected",
  revision: "bg-status-revision-soft text-status-revision",
};

export function KpiTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  onClick,
}: KpiTileProps) {
  const content = (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-[12px] font-semibold uppercase tracking-wide text-text-muted">
          {label}
        </div>
        <div className="mt-1 text-[26px] font-extrabold leading-none text-text-dark">{value}</div>
        {hint ? <div className="mt-1.5 text-[12px] text-text-subtle">{hint}</div> : null}
      </div>
      {Icon ? (
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", TONE[tone])}>
          <Icon size={18} />
        </span>
      ) : null}
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded-xl border border-border-soft bg-surface p-4 text-left shadow-card transition-colors hover:border-accent/50 hover:bg-info-soft/40"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border-soft bg-surface p-4 shadow-card">{content}</div>
  );
}
