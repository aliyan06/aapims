import { Activity, BadgeCheck, Building2, FileText, ShieldCheck, Users } from "lucide-react";
import {
  DataTable,
  KpiTile,
  PortalPage,
  SectionCard,
  StatusBadge,
  Timeline,
  type Column,
  type TimelineStep,
} from "@/components/desktop";
import type { RbacRole, Role } from "@/data/types";
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { DEMO_ACCOUNTS, ROLE_LABEL, type DemoAccount } from "@/components/shell/roles";
import { formatDateTime, useApplications, useAudit, usePermits, useRbacRoles } from "@/store";

/**
 * Maps an RBAC role definition key (data layer) to the coarse `Role` used by
 * `ROLE_PERMISSIONS`, so permission counts can be shown for every listed role.
 */
const RBAC_ROLE_TO_ROLE: Record<string, Role> = {
  "super-admin": "superadmin",
  "permit-reviewer": "reviewer",
  "permit-approver": "approver",
  "finance-officer": "finance",
  "operator-admin": "operatorAdmin",
  "permit-officer": "permitOfficer",
  "operator-finance": "operatorFinance",
  viewer: "viewer",
};

const ROLE_SIDES: readonly {
  side: RbacRole["side"];
  description: string;
}[] = [
  { side: "Authority Side", description: "Government authority staff accounts." },
  { side: "Customer Side", description: "Operator and applicant accounts." },
];

export function SuperAdminDashboard() {
  const applications = useApplications();
  const permits = usePermits();
  const audit = useAudit();
  const roles = useRbacRoles();

  const registeredOperators = new Set(applications.map((application) => application.operatorId))
    .size;

  const userColumns: Column<DemoAccount>[] = [
    {
      key: "name",
      header: "Name",
      cell: (account) => (
        <span className="font-semibold text-text-dark">{ROLE_LABEL[account.role]}</span>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (account) => <span className="text-text-muted">{account.email}</span>,
    },
    {
      key: "side",
      header: "Side",
      cell: (account) => account.side,
    },
    {
      key: "role",
      header: "Role",
      cell: (account) => (
        <span className="font-mono text-[12px] text-text-muted">{account.role}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      cell: () => <StatusBadge label="Active" tone="cleared" />,
    },
  ];

  const activity: TimelineStep[] = [...audit]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 8)
    .map((entry) => ({
      label: entry.action,
      state: "done",
      timestamp: formatDateTime(entry.at),
      by: entry.actor,
      note: entry.applicationReference,
    }));

  return (
    <PortalPage
      title="System Administration"
      description="Super Admin console for account administration, the role and permission model, and a live view of platform activity across the authority and operator portals."
      breadcrumb={[{ label: "Authority" }, { label: "Administration" }]}
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile
            label="Total applications"
            value={applications.length}
            hint="All applications in the system"
            icon={FileText}
            tone="info"
          />
          <KpiTile
            label="Active permits"
            value={permits.length}
            hint="Issued and reissued e-permits"
            icon={BadgeCheck}
            tone="success"
          />
          <KpiTile
            label="Registered operators"
            value={registeredOperators}
            hint="Distinct operator accounts with applications"
            icon={Building2}
            tone="revision"
          />
          <KpiTile
            label="Audit events"
            value={audit.length}
            hint="Recorded across the lifecycle"
            icon={Activity}
            tone="warning"
          />
        </div>

        <SectionCard
          title="Users"
          description="Demo accounts provisioned in the system, with their side, role and session status."
          padded={false}
        >
          <DataTable
            columns={userColumns}
            rows={[...DEMO_ACCOUNTS]}
            getRowKey={(account) => account.email}
            emptyTitle="No user accounts"
          />
        </SectionCard>

        <div className="grid gap-5 lg:grid-cols-2">
          {ROLE_SIDES.map((group) => (
            <SectionCard key={group.side} title={group.side} description={group.description}>
              <ul className="space-y-2">
                {roles
                  .filter((role) => role.side === group.side)
                  .map((role) => {
                    const mapped = RBAC_ROLE_TO_ROLE[role.key];
                    const count = mapped ? ROLE_PERMISSIONS[mapped].length : 0;
                    return (
                      <li
                        key={role.key}
                        className="flex items-start justify-between gap-3 rounded-lg border border-border-soft px-4 py-3"
                      >
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold text-text-dark">{role.label}</div>
                          <p className="mt-0.5 text-[12px] text-text-muted">{role.description}</p>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-bold text-text-muted">
                          <ShieldCheck size={12} /> {count}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </SectionCard>
          ))}
        </div>

        <SectionCard
          title="Recent activity"
          description="The latest audited actions across the shared permit lifecycle."
        >
          {activity.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Users size={20} className="text-text-subtle" />
              <p className="text-[12px] text-text-muted">No audit activity recorded yet.</p>
            </div>
          ) : (
            <Timeline steps={activity} />
          )}
        </SectionCard>
      </div>
    </PortalPage>
  );
}
