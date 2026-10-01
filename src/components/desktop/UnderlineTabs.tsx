import { cn } from "@/lib/utils";

export type UnderlineTab = {
  key: string;
  label: string;
  count?: number;
};

type UnderlineTabsProps = {
  tabs: UnderlineTab[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
};

export function UnderlineTabs({ tabs, value, onChange, className }: UnderlineTabsProps) {
  return (
    <div className={cn("flex items-center gap-1 border-b border-border-soft", className)}>
      {tabs.map((tab) => {
        const active = tab.key === value;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              "-mb-px flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-[13px] font-semibold transition-colors",
              active
                ? "border-accent text-accent"
                : "border-transparent text-text-muted hover:text-text-dark",
            )}
          >
            {tab.label}
            {typeof tab.count === "number" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  active ? "bg-accent text-accent-foreground" : "bg-surface-muted text-text-subtle",
                )}
              >
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
