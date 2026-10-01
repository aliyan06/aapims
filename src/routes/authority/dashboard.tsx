import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  FilePlus,
  FileText,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  ApplicationStatusBadge,
  DataTable,
  KpiTile,
  PortalPage,
  SectionCard,
  type Column,
} from "@/components/desktop";
import { operatorName } from "@/data";
import type { ApplicationRecord, ApplicationStatus } from "@/data/types";
import { formatDate, useApplications, useCounters, useWorld } from "@/store";

export const Route = createFileRoute("/authority/dashboard")({
  component: AuthorityDashboard,
});

const WORK_QUEUE_STATUSES: readonly ApplicationStatus[] = [
  "SUBMITTED",
  "UNDER REVIEW",
  "AWAITING FINANCE",
  "TECHNICAL REVIEW",
  "AWAITING FINAL APPROVAL",
];

type AlertItem = {
  id: string;
  label: string;
  detail: string;
  reference: string;
  icon: LucideIcon;
  tone: "warning" | "danger" | "info";
};

const ALERT_TONE: Record<AlertItem["tone"], string> = {
  warning: "bg-warning-soft text-status-awaiting",
  danger: "bg-danger-soft text-status-rejected",
  info: "bg-info-soft text-accent",
};

function AuthorityDashboard() {
  const navigate = useNavigate();
  const world = useWorld();
  const applications = useApplications();
  const counters = useCounters();

  const workQueue = [...applications]
    .filter((application) => WORK_QUEUE_STATUSES.includes(application.status))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const alerts: AlertItem[] = [];

  for (const application of applications) {
    if (application.status === "RETURNED") {
      alerts.push({
        id: `returned-${application.id}`,
        label: "Returned to operator",
        detail: `${operatorName(world, application.operatorId)} must correct ${application.reference}.`,
        reference: application.reference,
        icon: AlertTriangle,
        tone: "danger",
      });
    } else if (application.status === "AWAITING FINANCE") {
      alerts.push({
        id: `finance-${application.id}`,
        label: "Awaiting financial clearance",
        detail: `${application.reference} is held at the finance desk.`,
        reference: application.reference,
        icon: Wallet,
        tone: "warning",
      });
    } else if (application.status === "AWAITING FINAL APPROVAL") {
      alerts.push({
        id: `approval-${application.id}`,
        label: "Awaiting final approval",
        detail: `${application.reference} is ready for the approver's decision.`,
        reference: application.reference,
        icon: BadgeCheck,
        tone: "info",
      });
    }
  }

  const columns: Column<ApplicationRecord>[] = [
    {
      key: "reference",
      header: "Reference",
      cell: (application) => (
        <Link
          to="/authority/applications/$reference"
          params={{ reference: application.reference }}
          className="font-semibold text-accent hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          {application.reference}
        </Link>
      ),
    },
    {
      key: "operator",
      header: "Operator",
      cell: (application) => operatorName(world, application.operatorId),
    },
    {
      key: "route",
      header: "Route",
      cell: (application) =>
        `${application.route.originIcao} → ${application.route.destinationIcao}`,
    },
    {
      key: "operation",
      header: "Operation date",
      cell: (application) => formatDate(application.route.departureAt),
    },
    {
      key: "status",
      header: "Status",
      cell: (application) => <ApplicationStatusBadge status={application.status} />,
    },
    {
      key: "action",
      header: "",
      align: "right",
      cell: (application) => (
        <button
          type="button"
          className="rounded-md border border-border-strong px-3 py-1.5 text-[12px] font-semibold text-text-dark transition-colors hover:bg-surface-muted"
          onClick={(event) => {
            event.stopPropagation();
            navigate({
              to: "/authority/applications/$reference",
              params: { reference: application.reference },
            });
          }}
        >
          Open
        </button>
      ),
    },
  ];

  return (
    <PortalPage
      title="Authority Dashboard"
      description="Pipeline at a glance across every permit application in the aviation authority workflow."
      breadcrumb={[{ label: "Authority" }, { label: "Dashboard" }]}
      actions={
        <button
          type="button"
          onClick={() => navigate({ to: "/authority/applications" })}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-accent-foreground transition-colors hover:bg-accent-pressed"
        >
          <FileText size={15} /> All applications
        </button>
      }
    >
      <div className="space-y-5">
        <SectionCard title="Pipeline" description="Applications by lifecycle stage.">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile
              label="New applications"
              value={counters.newApplications}
              hint="Submitted, awaiting review"
              icon={FilePlus}
              tone="info"
              onClick={() => navigate({ to: "/authority/applications" })}
            />
            <KpiTile
              label="Under review"
              value={counters.underReview}
              hint="With a permit reviewer"
              icon={FileText}
              tone="info"
              onClick={() => navigate({ to: "/authority/applications" })}
            />
            <KpiTile
              label="Awaiting finance"
              value={counters.awaitingFinance}
              hint="Pending financial clearance"
              icon={Wallet}
              tone="warning"
              onClick={() => navigate({ to: "/authority/finance" })}
            />
            <KpiTile
              label="Technical review"
              value={counters.technicalReview}
              hint="Route and airframe checks"
              icon={ClipboardCheck}
              tone="warning"
              onClick={() => navigate({ to: "/authority/technical" })}
            />
            <KpiTile
              label="Awaiting approval"
              value={counters.awaitingApproval}
              hint="Ready for the approver"
              icon={BadgeCheck}
              tone="warning"
              onClick={() => navigate({ to: "/authority/approval" })}
            />
            <KpiTile
              label="Approved"
              value={counters.approved}
              hint="Approved, pending issuance"
              icon={CheckCircle2}
              tone="success"
              onClick={() => navigate({ to: "/authority/permits" })}
            />
            <KpiTile
              label="Issued permits"
              value={counters.issued}
              hint="Digital e-permits issued"
              icon={ShieldCheck}
              tone="success"
              onClick={() => navigate({ to: "/authority/permits" })}
            />
          </div>
        </SectionCard>

        <div className="grid gap-5 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <SectionCard
              title="Work queue"
              description="Applications requiring authority attention, oldest first."
              actions={
                <Link
                  to="/authority/applications"
                  className="text-[12px] font-semibold text-accent hover:underline"
                >
                  View all
                </Link>
              }
              padded={false}
            >
              <DataTable
                columns={columns}
                rows={workQueue}
                getRowKey={(application) => application.id}
                onRowClick={(application) =>
                  navigate({
                    to: "/authority/applications/$reference",
                    params: { reference: application.reference },
                  })
                }
                emptyTitle="Nothing in the queue"
                emptyDescription="Every application has been actioned. New submissions will appear here."
              />
            </SectionCard>
          </div>

          <SectionCard
            title="Operational alerts"
            description="Applications that need a decision or correction."
          >
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle2 size={20} className="text-status-cleared" />
                <p className="text-[12px] text-text-muted">No outstanding alerts.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {alerts.map((alert) => {
                  const Icon = alert.icon;
                  return (
                    <li key={alert.id}>
                      <Link
                        to="/authority/applications/$reference"
                        params={{ reference: alert.reference }}
                        className="flex gap-3 rounded-lg border border-border-soft px-3.5 py-3 transition-colors hover:border-accent/50 hover:bg-info-soft/30"
                      >
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ALERT_TONE[alert.tone]}`}
                        >
                          <Icon size={15} />
                        </span>
                        <div className="min-w-0">
                          <div className="text-[12.5px] font-semibold text-text-dark">
                            {alert.label}
                          </div>
                          <div className="text-[12px] text-text-muted">{alert.detail}</div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </PortalPage>
  );
}
