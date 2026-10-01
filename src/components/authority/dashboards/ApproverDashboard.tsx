import { Link, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, FileCheck2, RefreshCw, Stamp } from "lucide-react";
import {
  ApplicationStatusBadge,
  DataTable,
  KpiTile,
  PortalPage,
  SectionCard,
  Timeline,
  type Column,
  type TimelineStep,
} from "@/components/desktop";
import { getAircraft, operatorName } from "@/data";
import type { ApplicationRecord } from "@/data/types";
import { formatDateTime, useApplications, useAudit, useRevisions, useWorld } from "@/store";

export function ApproverDashboard() {
  const navigate = useNavigate();
  const world = useWorld();
  const applications = useApplications();
  const revisions = useRevisions();
  const audit = useAudit();

  const awaitingApproval = applications.filter(
    (application) => application.status === "AWAITING FINAL APPROVAL",
  );
  const approved = applications.filter((application) => application.status === "APPROVED");
  const issued = applications.filter(
    (application) => application.status === "ISSUED" || application.status === "REISSUED",
  );
  const pendingRevisions = revisions.filter((revision) => revision.status === "PENDING");

  const recentDecisions: TimelineStep[] = [...audit]
    .filter((entry) => entry.role === "approver")
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 6)
    .map((entry) => ({
      label: entry.action,
      state: "done",
      timestamp: formatDateTime(entry.at),
      by: entry.actor,
      note: entry.applicationReference,
    }));

  const queueColumns: Column<ApplicationRecord>[] = [
    {
      key: "reference",
      header: "Reference",
      cell: (application) => (
        <span className="font-semibold text-accent">{application.reference}</span>
      ),
    },
    {
      key: "operator",
      header: "Operator",
      cell: (application) => operatorName(world, application.operatorId),
    },
    {
      key: "aircraft",
      header: "Aircraft",
      cell: (application) => getAircraft(world, application.aircraftId).registration,
    },
    {
      key: "flight",
      header: "Flight",
      cell: (application) => application.flight.flightNumber,
    },
    {
      key: "route",
      header: "Route",
      cell: (application) =>
        `${application.route.originIcao} → ${application.route.destinationIcao}`,
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
              to: "/authority/approval/$reference",
              params: { reference: application.reference },
            });
          }}
        >
          Review
        </button>
      ),
    },
  ];

  return (
    <PortalPage
      title="Permit Approval Dashboard"
      description="The Permit Approver desk makes the final decision and issues the digital e-permit."
      breadcrumb={[{ label: "Authority" }, { label: "Dashboard" }]}
      actions={
        <Link
          to="/authority/approval"
          className="text-[12px] font-semibold text-accent hover:underline"
        >
          Open approval queue
        </Link>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile
            label="Awaiting final approval"
            value={awaitingApproval.length}
            hint="Ready for the final decision"
            icon={Stamp}
            tone="warning"
            onClick={() => navigate({ to: "/authority/approval" })}
          />
          <KpiTile
            label="Approved — awaiting issue"
            value={approved.length}
            hint="Approved, pending issuance"
            icon={FileCheck2}
            tone="info"
          />
          <KpiTile
            label="Issued"
            value={issued.length}
            hint="Digital e-permits issued"
            icon={BadgeCheck}
            tone="success"
            onClick={() => navigate({ to: "/authority/permits" })}
          />
          <KpiTile
            label="Revisions pending"
            value={pendingRevisions.length}
            hint="Operator changes awaiting decision"
            icon={RefreshCw}
            tone="revision"
          />
        </div>

        <SectionCard
          title="Approval queue"
          description="Applications awaiting the final approval decision."
          actions={
            <Link
              to="/authority/approval"
              className="text-[12px] font-semibold text-accent hover:underline"
            >
              View all
            </Link>
          }
          padded={false}
        >
          <DataTable
            columns={queueColumns}
            rows={awaitingApproval}
            getRowKey={(application) => application.id}
            onRowClick={(application) =>
              navigate({
                to: "/authority/approval/$reference",
                params: { reference: application.reference },
              })
            }
            emptyTitle="Nothing awaiting approval"
            emptyDescription="Applications arrive here after technical review passes."
          />
        </SectionCard>

        <div className="grid gap-5 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <SectionCard
              title="Awaiting issuance"
              description="Approved applications ready to be issued as digital e-permits."
            >
              {approved.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <BadgeCheck size={20} className="text-status-cleared" />
                  <p className="text-[12px] text-text-muted">
                    No approved applications are awaiting issuance.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {approved.map((application) => (
                    <li key={application.id}>
                      <div className="flex items-center justify-between gap-3 rounded-lg border border-border-soft px-3.5 py-3">
                        <div className="min-w-0">
                          <div className="text-[12.5px] font-semibold text-text-dark">
                            {application.reference}
                          </div>
                          <div className="text-[12px] text-text-muted">
                            {operatorName(world, application.operatorId)} ·{" "}
                            {application.route.originIcao} → {application.route.destinationIcao}
                          </div>
                        </div>
                        <Link
                          to="/authority/approval/$reference"
                          params={{ reference: application.reference }}
                          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-accent px-3.5 py-2 text-[12px] font-semibold text-accent-foreground transition-colors hover:bg-accent-pressed"
                        >
                          <BadgeCheck size={14} /> Issue permit
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>

          <SectionCard title="Recent decisions" description="Latest approver activity.">
            {recentDecisions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Stamp size={20} className="text-text-subtle" />
                <p className="text-[12px] text-text-muted">No approver decisions recorded yet.</p>
              </div>
            ) : (
              <Timeline steps={recentDecisions} />
            )}
          </SectionCard>
        </div>
      </div>
    </PortalPage>
  );
}
