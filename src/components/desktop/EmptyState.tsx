import type { ComponentType, ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: ComponentType<{ size?: number; className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-text-subtle">
        <Icon size={22} />
      </span>
      <h3 className="mt-3 text-[15px] font-bold text-text-dark">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-[13px] text-text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
