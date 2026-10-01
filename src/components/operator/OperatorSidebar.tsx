import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  CreditCard,
  FilePlus,
  FileText,
  FolderCheck,
  LayoutDashboard,
  LogOut,
  Plane,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { PortalSidebar, type SidebarItem } from "@/components/desktop";
import { ROLE_LABEL } from "@/components/shell/roles";
import { isCustomerRole, roleHasPermission } from "@/lib/rbac";
import { roleToAudience, useActiveRole, useAppStore, useOperator, useUnreadCount } from "@/store";
import { cn } from "@/lib/utils";

/** Status pill shown in the sidebar footer, driven by the operator record. */
const STATUS_TONE: Record<string, string> = {
  VERIFIED: "border-status-approved/40 bg-status-approved/15 text-status-approved-soft",
  PENDING: "border-status-awaiting/40 bg-status-awaiting/15 text-status-awaiting-soft",
  SUSPENDED: "border-status-rejected/40 bg-status-rejected/15 text-status-rejected-soft",
};

export function OperatorSidebar() {
  const navigate = useNavigate();
  const signOut = useAppStore((state) => state.signOut);
  const activeRole = useActiveRole();
  const role = isCustomerRole(activeRole) ? activeRole : "operatorAdmin";
  const operator = useOperator();
  const unread = useUnreadCount(roleToAudience(role));

  const items: SidebarItem[] = [
    { label: "Dashboard", to: "/operator/dashboard", icon: LayoutDashboard },
  ];

  if (roleHasPermission(role, "app.view")) {
    items.push({ label: "My Applications", to: "/operator/applications", icon: FileText });
  }
  if (roleHasPermission(role, "app.create")) {
    items.push({ label: "Apply for Permit", to: "/operator/apply", icon: FilePlus });
  }
  if (roleHasPermission(role, "aircraft.manage")) {
    items.push({ label: "Aircraft", to: "/operator/aircraft", icon: Plane });
  }
  if (roleHasPermission(role, "doc.manage")) {
    items.push({ label: "Documents", to: "/operator/documents", icon: FolderCheck });
  }
  if (roleHasPermission(role, "agent.manage")) {
    items.push({ label: "Agents", to: "/operator/agents", icon: UserCog });
  }
  if (roleHasPermission(role, "payment.manage")) {
    items.push({ label: "Payments", to: "/operator/payments", icon: CreditCard });
  }
  if (roleHasPermission(role, "permit.view")) {
    items.push({ label: "My Permits", to: "/operator/permits", icon: ShieldCheck });
  }
  if (roleHasPermission(role, "org.profile.manage")) {
    items.push({ label: "Registration", to: "/operator/registration", icon: Building2 });
  }
  items.push({ label: "Profile", to: "/operator/profile", icon: Building2 });
  items.push({ label: "Notifications", to: "/operator/notifications", icon: Bell, badge: unread });

  const footer = (
    <div className="leading-tight">
      <div className="truncate text-[13px] font-bold text-white">{operator.company}</div>
      <div className="mt-1 text-[11px] font-semibold text-white/60">{ROLE_LABEL[role]}</div>
      <div className="mt-1 flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            STATUS_TONE[operator.status] ?? STATUS_TONE.PENDING,
          )}
        >
          {operator.status}
        </span>
        <span className="text-[10px] font-semibold text-white/50">{operator.operatorId}</span>
      </div>
      <button
        type="button"
        onClick={() => {
          signOut();
          navigate({ to: "/login" });
        }}
        className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-white/60 transition-colors hover:text-white"
      >
        <LogOut size={13} />
        Sign out
      </button>
    </div>
  );

  return <PortalSidebar portalLabel="Operator Portal" items={items} footer={footer} />;
}
