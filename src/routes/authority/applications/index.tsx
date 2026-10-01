import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ApplicationStatusBadge,
  DataTable,
  PortalPage,
  SectionCard,
  UnderlineTabs,
  type Column,
} from "@/components/desktop";
import { operatorName } from "@/data";
import type { ApplicationRecord, ApplicationStatus } from "@/data/types";
import { formatDate, useApplications, useWorld } from "@/store";

export const Route = createFileRoute("/authority/applications/")({
  component: ApplicationsIndex,
});

const TAB_KEYS = [
  "all",
  "submitted",
  "under-review",
  "awaiting-finance",
  "technical",
  "awaiting-approval",
  "approved",
  "issued",
  "returned",
  "rejected",
] as const;
type TabKey = (typeof TAB_KEYS)[number];

function matchesTab(application: ApplicationRecord, tab: TabKey): boolean {
  switch (tab) {
    case "all":
      return true;
    case "submitted":
      return application.status === "SUBMITTED";
    case "under-review":
      return application.status === "UNDER REVIEW";
    case "awaiting-finance":
      return application.status === "AWAITING FINANCE";
    case "technical":
      return application.status === "TECHNICAL REVIEW";
    case "awaiting-approval":
      return application.status === "AWAITING FINAL APPROVAL";
    case "approved":
      return application.status === "APPROVED";
    case "issued":
      return application.status === "ISSUED" || application.status === "REISSUED";
    case "returned":
      return application.status === "RETURNED";
    case "rejected":
      return application.status === "REJECTED";
    default:
      return true;
  }
}

const TAB_LABELS: Record<TabKey, string> = {
  all: "All",
  submitted: "Submitted",
  "under-review": "Under Review",
  "awaiting-finance": "Awaiting Finance",
  technical: "Technical",
  "awaiting-approval": "Awaiting Approval",
  approved: "Approved",
  issued: "Issued",
  returned: "Returned",
  rejected: "Rejected",
};

function ApplicationsIndex() {
  const navigate = useNavigate();
  const world = useWorld();
  const applications = useApplications();
  const [tab, setTab] = useState<TabKey>("all");

  const sorted = useMemo(
    () =>
      [...applications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [applications],
  );

  const rows = sorted.filter((application) => matchesTab(application, tab));

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
      key: "permitType",
      header: "Permit Type",
      cell: (application) => application.permitKind,
    },
    {
      key: "route",
      header: "Route",
      cell: (application) =>
        `${application.route.originIcao} → ${application.route.destinationIcao}`,
    },
    {
      key: "operation",
      header: "Operation Date",
      cell: (application) => formatDate(application.route.departureAt),
    },
    {
      key: "status",
      header: "Status",
      cell: (application) => <ApplicationStatusBadge status={application.status} />,
    },
    {
      key: "reviewer",
      header: "Assigned Reviewer",
      cell: (application) => application.assignedReviewer,
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
          Review
        </button>
      ),
    },
  ];

  const tabLabel = (key: TabKey): string => TAB_LABELS[key];

  return (
    <PortalPage
      title="Applications"
      description="Every permit application received by the authority, with its current workflow stage."
      breadcrumb={[{ label: "Authority" }, { label: "Applications" }]}
      tabs={
        <UnderlineTabs
          value={tab}
          onChange={(key) => setTab(key as TabKey)}
          tabs={TAB_KEYS.map((key) => ({
            key,
            label: tabLabel(key),
            count: sorted.filter((application) => matchesTab(application, key)).length,
          }))}
        />
      }
    >
      <SectionCard padded={false}>
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(application) => application.id}
          onRowClick={(application) =>
            navigate({
              to: "/authority/applications/$reference",
              params: { reference: application.reference },
            })
          }
          emptyTitle="No applications in this view"
          emptyDescription="Try another filter or wait for a new submission."
        />
      </SectionCard>
    </PortalPage>
  );
}
