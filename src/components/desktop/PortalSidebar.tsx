import type { ComponentType, ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { MoavinLogo } from "./Brand";

export type SidebarItem = {
  label: string;
  to: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  badge?: number;
  exact?: boolean;
};

type PortalSidebarProps = {
  portalLabel: string;
  items: SidebarItem[];
  footer?: ReactNode;
};

export function PortalSidebar({ portalLabel, items, footer }: PortalSidebarProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[13px] font-black text-accent-foreground">
          AA
        </span>
        <div className="leading-tight">
          <div className="text-[14px] font-black tracking-wide text-white">AAPIMS</div>
          <div className="text-[10px] font-semibold text-white/60">{portalLabel}</div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3 no-scrollbar">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.to
            : pathname === item.to || pathname.startsWith(`${item.to}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors",
                active
                  ? "bg-sidebar-accent text-white"
                  : "text-white/70 hover:bg-sidebar-accent/60 hover:text-white",
              )}
            >
              <Icon size={16} className={active ? "text-accent" : "text-white/60"} />
              <span className="flex-1 truncate">{item.label}</span>
              {typeof item.badge === "number" && item.badge > 0 ? (
                <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3">
        {footer}
        <div className="mt-3 flex items-center gap-2 border-t border-sidebar-border pt-3">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
            Powered by
          </span>
          <MoavinLogo className="h-5 w-auto brightness-0 invert" />
        </div>
      </div>
    </aside>
  );
}
