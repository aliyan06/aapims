import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionCardProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
};

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  padded = true,
}: SectionCardProps) {
  return (
    <section
      className={cn("rounded-xl border border-border-soft bg-surface shadow-card", className)}
    >
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 border-b border-border-soft px-5 py-3.5">
          <div>
            {title ? <h2 className="text-[14px] font-bold text-text-dark">{title}</h2> : null}
            {description ? (
              <p className="mt-0.5 text-[12px] text-text-muted">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}
