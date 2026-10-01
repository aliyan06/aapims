import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  RotateCcw,
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
import type { ApplicationRecord } from "@/data/types";
import { formatDate, useApplications, useClockIso, useWorld } from "@/store";

/** Permit Reviewer desk: the applications awaiting review and technical checks. */
export function ReviewerDashboard() {
  const navigate = useNavigate();
  const world = useWorld();
  const applications = useApplications();
  const clockIso = useClockIso();

  const today = clockIso.slice(0, 10);

  const awaitingReview = applications.filter(
    (application) => application.status === "SUBMITTED" || application.status === "UNDER REVIEW",
  );
  const technicalQueue = applications.filter(
    (application) => application.status === "TECHNICAL REVIEW",
  );
  const returned = applications.filter((application) => application.status === "RETURNED");

  let recommendedToday = 0;
  for (const application of applications) {
    for (const entry of application.history) {
      if (
        entry.role === "reviewer" &&
        entry.status === "AWAITING FINANCE" &&
        entry.at.slice(0, 10) === today
      ) {
        recommendedToday += 1;
      }
    }
  }

  const rowColumns: Column<ApplicationRecord>[] = [
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
      key: "aircraft",
      header: "Aircraft",
      cell: (application) =>
        world.aircraft.find((item) => item.id === application.aircraftId)?.registration ?? "—",
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
  ];

  return (
    <PortalPage
      title="Permit Review Dashboard"
      description="Permit Reviewer desk — applications submitted by operators, reviewed for completeness before finance and technical clearance."
      breadcrumb={[{ label: "Authority" }, { label: "Reviewer" }]}
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
        <SectionCard title="Review desk" description="Workload on the permit reviewer desk today.">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile
              label="Awaiting my review"
              value={awaitingReview.length}
              hint="Submitted or under review"
              icon={FileText}
              tone="info"
              onClick={() => navigate({ to: "/authority/applications" })}
            />
            <KpiTile
              label="Technical review"
              value={technicalQueue.length}
              hint="Route and airframe checks"
              icon={ClipboardCheck}
              tone="warning"
              onClick={() => navigate({ to: "/authority/technical" })}
            />
            <KpiTile
              label="Returned to operator"
              value={returned.length}
              hint="Awaiting operator correction"
              icon={RotateCcw}
              tone="danger"
              onClick={() => navigate({ to: "/authority/applications" })}
            />
            <KpiTile
              label="Recommended today"
              value={recommendedToday}
              hint="Forwarded to finance this session"
              icon={BadgeCheck}
              tone="success"
              onClick={() => navigate({ to: "/authority/applications" })}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Review queue"
          description="Fresh submissions and in-review applications, oldest first."
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
            columns={rowColumns}
            rows={[...awaitingReview].sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            )}
            getRowKey={(application) => application.id}
            onRowClick={(application) =>
              navigate({
                to: "/authority/applications/$reference",
                params: { reference: application.reference },
              })
            }
            emptyTitle="Nothing awaiting review"
            emptyDescription="New submissions will appear here for first review."
          />
        </SectionCard>

        <div className="grid gap-5 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <SectionCard
              title="Technical review queue"
              description="Applications cleared by finance and awaiting route and airframe verification."
              padded={false}
            >
              <DataTable
                columns={rowColumns}
                rows={technicalQueue}
                getRowKey={(application) => application.id}
                onRowClick={(application) =>
                  navigate({
                    to: "/authority/applications/$reference/technical",
                    params: { reference: application.reference },
                  })
                }
                emptyTitle="No applications at technical review"
                emptyDescription="Applications appear here once finance has cleared them."
              />
            </SectionCard>
          </div>

          <SectionCard
            title="Verification checklist"
            description="Returned applications awaiting operator correction."
          >
            {returned.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle2 size={20} className="text-status-cleared" />
                <p className="text-[12px] text-text-muted">
                  No returned applications. The queue is clear.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {returned.map((application) => {
                  const returnedAt = [...application.history]
                    .reverse()
                    .find((entry) => entry.status === "RETURNED")?.at;
                  return (
                    <li key={application.id}>
                      <Link
                        to="/authority/applications/$reference"
                        params={{ reference: application.reference }}
                        className="flex gap-3 rounded-lg border border-border-soft px-3.5 py-3 transition-colors hover:border-accent/50 hover:bg-info-soft/30"
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-danger-soft text-status-rejected">
                          <AlertTriangle size={15} />
                        </span>
                        <div className="min-w-0">
                          <div className="text-[12.5px] font-semibold text-text-dark">
                            {application.reference}
                          </div>
                          <div className="text-[12px] text-text-muted">
                            {operatorName(world, application.operatorId)} must correct and resubmit.
                          </div>
                          <div className="mt-0.5 text-[11px] text-text-subtle">
                            Returned {formatDate(returnedAt ?? application.createdAt)}
                          </div>
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
