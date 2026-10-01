import { Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Bell,
  ClipboardCheck,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Search,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { PortalSidebar, type SidebarItem } from "@/components/desktop";
import { ROLE_LABEL, isAuthorityRole } from "@/components/shell/roles";
import { roleHasPermission, type PermissionKey } from "@/lib/rbac";
import { roleToAudience, useActiveRole, useAuthority, useUnreadCount } from "@/store";

type NavEntry = {
  item: SidebarItem;
  permission?: PermissionKey;
};

/** Left navigation for the Authority Portal, scoped to the active authority role's permissions. */
export function AuthoritySidebar() {
  const activeRole = useActiveRole();
  const authority = useAuthority();

  const role = isAuthorityRole(activeRole) ? activeRole : "reviewer";
  const unread = useUnreadCount(roleToAudience(role));

  const entries: NavEntry[] = [
    { item: { label: "Dashboard", to: "/authority/dashboard", icon: LayoutDashboard } },
    {
      item: { label: "Applications", to: "/authority/applications", icon: FileText },
      permission: "app.view",
    },
    {
      item: { label: "Search", to: "/authority/search", icon: Search },
      permission: "app.view",
    },
    {
      item: { label: "Technical Review", to: "/authority/technical", icon: ClipboardCheck },
      permission: "tech.review",
    },
    {
      item: { label: "Finance", to: "/authority/finance", icon: Wallet },
      permission: "finance.verify",
    },
    {
      item: { label: "Approval", to: "/authority/approval", icon: BadgeCheck },
      permission: "permit.approve",
    },
    {
      item: { label: "Issued Permits", to: "/authority/permits", icon: ShieldCheck },
      permission: "permit.view",
    },
    {
      item: { label: "Audit Trail", to: "/authority/audit", icon: History },
      permission: "audit.view",
    },
    {
      item: { label: "Roles & Permissions", to: "/authority/roles", icon: Users },
      permission: "roles.manage",
    },
    {
      item: { label: "Notifications", to: "/authority/notifications", icon: Bell, badge: unread },
    },
  ];

  const items: SidebarItem[] = entries
    .filter((entry) => !entry.permission || roleHasPermission(role, entry.permission))
    .map((entry) => entry.item);

  const footer = (
    <div className="leading-tight">
      <div className="truncate text-[13px] font-bold text-white">{authority.name}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-white/50">
        {ROLE_LABEL[role]}
      </div>
      <Link
        to="/login"
        className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-white/60 transition-colors hover:text-white"
      >
        <LogOut size={13} />
        Sign out
      </Link>
    </div>
  );

  return <PortalSidebar portalLabel="Authority Portal" items={items} footer={footer} />;
}
