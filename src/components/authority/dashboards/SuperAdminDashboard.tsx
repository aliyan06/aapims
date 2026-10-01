import {
  Activity,
  BadgeCheck,
  Building2,
  FileText,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import {
  Checklist,
  DataTable,
  DescriptionList,
  KpiTile,
  PortalPage,
  SectionCard,
  StatusBadge,
  Timeline,
  type ChecklistItem,
  type Column,
  type TimelineStep,
} from "@/components/desktop";
import { Button } from "@/components/ui/button";
import type { AgentRecord, OperatorRecord, RbacRole, Role, VerificationStatus } from "@/data/types";
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { DEMO_ACCOUNTS, ROLE_LABEL, type DemoAccount } from "@/components/shell/roles";
import {
  formatDate,
  formatDateTime,
  useAgents,
  useAppStore,
  useApplications,
  useAudit,
  useClockIso,
  useOperator,
  usePermits,
  usePermission,
  useRbacRoles,
} from "@/store";
import type { StatusTone } from "@/lib/status";

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

const KYC_TONE: Record<OperatorRecord["kycStatus"], StatusTone> = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  "UNDER REVIEW": "review",
  APPROVED: "approved",
  ACTIVE: "issued",
};

const AUTHORIZATION_TONE: Record<VerificationStatus, StatusTone> = {
  VERIFIED: "approved",
  "PENDING VERIFICATION": "submitted",
  REJECTED: "rejected",
};

export function SuperAdminDashboard() {
  const applications = useApplications();
  const permits = usePermits();
  const audit = useAudit();
  const roles = useRbacRoles();
  const operator = useOperator();
  const agents = useAgents();
  const clockIso = useClockIso();
  const canManage = usePermission("user.manage");
  const approveRegistration = useAppStore((s) => s.approveRegistration);
  const verifyAgent = useAppStore((s) => s.verifyAgent);

  const today = clockIso.slice(0, 10);
  const kycReviewed = operator.kycStatus === "APPROVED" || operator.kycStatus === "ACTIVE";
  const kycChecks: ChecklistItem[] = [
    {
      id: "kyc-profile",
      label: "Company profile complete",
      detail: `${operator.company} · ${operator.operatorId}`,
      done: Boolean(operator.company && operator.contactEmail),
    },
    {
      id: "kyc-aoc",
      label: "AOC valid",
      detail: `${operator.aocNumber} — valid until ${formatDate(operator.aocValidUntil)}`,
      done: operator.aocValidUntil >= today,
    },
    {
      id: "kyc-documents",
      label: "KYC documents verified",
      detail: "Identity, ownership and certification documents checked.",
      done: kycReviewed,
    },
    {
      id: "kyc-approved",
      label: "Registration approved",
      detail: "Operator account activated for permit applications.",
      done: operator.kycStatus === "ACTIVE",
    },
  ];

  const agentColumns: Column<AgentRecord>[] = [
    {
      key: "name",
      header: "Agent",
      cell: (agent) => <span className="font-semibold text-text-dark">{agent.name}</span>,
    },
    { key: "agentId", header: "Agent ID", cell: (agent) => agent.agentId },
    {
      key: "authorization",
      header: "Authorization",
      cell: (agent) => (
        <StatusBadge label={agent.authorization} tone={AUTHORIZATION_TONE[agent.authorization]} />
      ),
    },
    { key: "loa", header: "LoA reference", cell: (agent) => agent.loaReference },
    {
      key: "validUntil",
      header: "Valid until",
      cell: (agent) => formatDate(agent.expiryDate),
    },
    {
      key: "action",
      header: "Action",
      align: "right",
      cell: (agent) => (
        <Button
          variant="outline"
          size="sm"
          disabled={!canManage || agent.authorization === "VERIFIED"}
          onClick={() => verifyAgent(agent.id)}
        >
          <UserCheck size={14} /> Verify
        </Button>
      ),
    },
  ];

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
          title="Operator verification (KYC)"
          description="Review the operator registration and activate the account once every KYC check passes."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <DescriptionList
              columns={2}
              items={[
                { label: "Operator", value: operator.company },
                {
                  label: "KYC status",
                  value: (
                    <StatusBadge label={operator.kycStatus} tone={KYC_TONE[operator.kycStatus]} />
                  ),
                },
                { label: "AOC number", value: operator.aocNumber },
                { label: "Country", value: operator.country },
              ]}
            />
            <Checklist items={kycChecks} />
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-4">
            <p className="text-[12px] text-text-muted">
              {!canManage
                ? "Your role has read-only access to operator verification."
                : operator.kycStatus === "ACTIVE"
                  ? "This operator account is already active."
                  : "Approving activates the operator so permits can be applied for."}
            </p>
            <Button
              disabled={!canManage || operator.kycStatus === "ACTIVE"}
              onClick={() => approveRegistration()}
            >
              <ShieldCheck size={15} /> Approve &amp; activate
            </Button>
          </div>
        </SectionCard>

        <SectionCard
          title="Agent verification"
          description="Authorised agents appointed by operators, with their Letter of Authorization and validity."
          padded={false}
        >
          <DataTable
            columns={agentColumns}
            rows={agents}
            getRowKey={(agent) => agent.id}
            emptyTitle="No agents registered"
            emptyDescription="Operators have not appointed any agents yet."
          />
        </SectionCard>

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
