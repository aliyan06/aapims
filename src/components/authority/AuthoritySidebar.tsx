import {
  BadgeCheck,
  Bell,
  ClipboardCheck,
  FileText,
  History,
  LayoutDashboard,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { PortalSidebar, type SidebarItem } from "@/components/desktop";
import { ROLE_LABEL, isAuthorityRole } from "@/components/shell/roles";
import { useActiveRole, useAuthority, useUnreadCount } from "@/store";

/** Left navigation for the Authority Portal, shared across reviewer, finance and approver roles. */
export function AuthoritySidebar() {
  const activeRole = useActiveRole();
  const authority = useAuthority();

  const role = isAuthorityRole(activeRole) ? activeRole : "reviewer";
  const unread = useUnreadCount(role);

  const items: SidebarItem[] = [
    { label: "Dashboard", to: "/authority/dashboard", icon: LayoutDashboard },
    { label: "Applications", to: "/authority/applications", icon: FileText },
    { label: "Technical Review", to: "/authority/technical", icon: ClipboardCheck },
    { label: "Finance", to: "/authority/finance", icon: Wallet },
    { label: "Approval", to: "/authority/approval", icon: BadgeCheck },
    { label: "Issued Permits", to: "/authority/permits", icon: ShieldCheck },
    { label: "Audit Trail", to: "/authority/audit", icon: History },
    { label: "Roles & Permissions", to: "/authority/roles", icon: Users },
    { label: "Notifications", to: "/authority/notifications", icon: Bell, badge: unread },
  ];

  const footer = (
    <div className="leading-tight">
      <div className="truncate text-[13px] font-bold text-white">{authority.name}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-white/50">
        {ROLE_LABEL[role]}
      </div>
    </div>
  );

  return <PortalSidebar portalLabel="Authority Portal" items={items} footer={footer} />;
}
