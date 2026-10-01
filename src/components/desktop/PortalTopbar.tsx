import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, LogOut } from "lucide-react";
import { ROLE_LABEL, ROLE_SHORT_LABEL, type Role } from "@/components/shell/roles";
import { useUnreadCount } from "@/store";

type PortalTopbarProps = {
  title: string;
  subtitle?: string;
  role: Role;
  actions?: ReactNode;
  notificationsTo: string;
};

export function PortalTopbar({
  title,
  subtitle,
  role,
  actions,
  notificationsTo,
}: PortalTopbarProps) {
  const unread = useUnreadCount(role);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border-soft bg-surface px-6">
      <div className="min-w-0">
        <h1 className="truncate text-[15px] font-bold text-text-dark">{title}</h1>
        {subtitle ? <p className="truncate text-[11px] text-text-muted">{subtitle}</p> : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {actions}
        <Link
          to={notificationsTo}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-muted hover:text-text-dark"
          aria-label="Notifications"
        >
          <Bell size={17} />
          {unread > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-rejected px-1 text-[10px] font-bold text-white">
              {unread}
            </span>
          ) : null}
        </Link>

        <div className="ml-1 flex items-center gap-2.5 rounded-lg border border-border-soft bg-surface px-2.5 py-1.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
            {ROLE_SHORT_LABEL[role].slice(0, 2).toUpperCase()}
          </span>
          <div className="leading-tight">
            <div className="text-[12px] font-semibold text-text-dark">{ROLE_LABEL[role]}</div>
            <div className="text-[10px] text-text-subtle">
              {role === "public" ? "Public" : "Signed in"}
            </div>
          </div>
          <Link
            to="/login"
            aria-label="Log out"
            className="ml-1 flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-muted hover:text-status-rejected"
          >
            <LogOut size={15} />
          </Link>
        </div>
      </div>
    </header>
  );
}
