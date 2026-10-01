import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Crumb = { label: string; to?: string };

type PortalPageProps = {
  title: string;
  description?: string;
  breadcrumb?: Crumb[];
  actions?: ReactNode;
  tabs?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PortalPage({
  title,
  description,
  breadcrumb,
  actions,
  tabs,
  children,
  className,
}: PortalPageProps) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b border-border-soft bg-surface px-6 py-5">
        {breadcrumb && breadcrumb.length > 0 ? (
          <nav className="mb-2 flex items-center gap-1 text-[11px] text-text-subtle">
            {breadcrumb.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                {index > 0 ? <ChevronRight size={12} /> : null}
                {crumb.to ? (
                  <Link to={crumb.to} className="font-semibold hover:text-accent">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-semibold text-text-muted">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : null}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-[20px] font-extrabold text-text-dark">{title}</h1>
            {description ? (
              <p className="mt-1 max-w-3xl text-[13px] text-text-muted">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
        {tabs ? <div className="mt-4 -mb-5">{tabs}</div> : null}
      </div>
      <div className={cn("flex-1 px-6 py-5", className)}>{children}</div>
    </div>
  );
}
