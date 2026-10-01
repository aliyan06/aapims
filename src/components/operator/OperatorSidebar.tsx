import {
  Bell,
  Building2,
  CreditCard,
  FilePlus,
  FileText,
  FolderCheck,
  LayoutDashboard,
  Plane,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { PortalSidebar, type SidebarItem } from "@/components/desktop";
import { useOperator, useUnreadCount } from "@/store";
import { cn } from "@/lib/utils";

/** Status pill shown in the sidebar footer, driven by the operator record. */
const STATUS_TONE: Record<string, string> = {
  VERIFIED: "border-status-approved/40 bg-status-approved/15 text-status-approved-soft",
  PENDING: "border-status-awaiting/40 bg-status-awaiting/15 text-status-awaiting-soft",
  SUSPENDED: "border-status-rejected/40 bg-status-rejected/15 text-status-rejected-soft",
};

export function OperatorSidebar() {
  const operator = useOperator();
  const unread = useUnreadCount("operator");

  const items: SidebarItem[] = [
    { label: "Dashboard", to: "/operator/dashboard", icon: LayoutDashboard },
    { label: "My Applications", to: "/operator/applications", icon: FileText },
    { label: "Apply for Permit", to: "/operator/apply", icon: FilePlus },
    { label: "Aircraft", to: "/operator/aircraft", icon: Plane },
    { label: "Documents", to: "/operator/documents", icon: FolderCheck },
    { label: "Agents", to: "/operator/agents", icon: UserCog },
    { label: "Payments", to: "/operator/payments", icon: CreditCard },
    { label: "My Permits", to: "/operator/permits", icon: ShieldCheck },
    { label: "Registration", to: "/operator/registration", icon: Building2 },
    { label: "Notifications", to: "/operator/notifications", icon: Bell, badge: unread },
  ];

  const footer = (
    <div className="leading-tight">
      <div className="truncate text-[13px] font-bold text-white">{operator.company}</div>
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
    </div>
  );

  return <PortalSidebar portalLabel="Operator Portal" items={items} footer={footer} />;
}
