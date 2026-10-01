import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, ClipboardList, FileClock, FileText } from "lucide-react";
import {
  ApplicationStatusBadge,
  DataTable,
  KpiTile,
  PortalPage,
  SectionCard,
  UnderlineTabs,
  type Column,
} from "@/components/desktop";
import { Button } from "@/components/ui/button";
import type { ApplicationRecord, ApplicationStatus } from "@/data";
import { getAircraft } from "@/data/lookups";
import { formatDate, useOperator, useOperatorApplications, useWorld } from "@/store";

export const Route = createFileRoute("/operator/applications/")({
  component: ApplicationsIndex,
});

const PENDING_STATUSES: readonly ApplicationStatus[] = [
  "SUBMITTED",
  "UNDER REVIEW",
  "AWAITING FINANCE",
  "TECHNICAL REVIEW",
  "AWAITING FINAL APPROVAL",
];

const TAB_KEYS = ["all", "draft", "pending", "approved", "issued"] as const;
type TabKey = (typeof TAB_KEYS)[number];

function matchesTab(application: ApplicationRecord, tab: TabKey): boolean {
  switch (tab) {
    case "all":
      return true;
    case "draft":
      return application.status === "DRAFT" || application.status === "RETURNED";
    case "pending":
      return PENDING_STATUSES.includes(application.status);
    case "approved":
      return application.status === "APPROVED";
    case "issued":
      return application.status === "ISSUED" || application.status === "REISSUED";
    default:
      return true;
  }
}

function ApplicationsIndex() {
  const navigate = useNavigate();
  const world = useWorld();
  const operator = useOperator();
  const applications = useOperatorApplications();
  const [tab, setTab] = useState<TabKey>("all");

  const sorted = useMemo(
    () =>
      [...applications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [applications],
  );

  const counts = {
    all: sorted.length,
    draft: sorted.filter((a) => matchesTab(a, "draft")).length,
    pending: sorted.filter((a) => matchesTab(a, "pending")).length,
    approved: sorted.filter((a) => matchesTab(a, "approved")).length,
    issued: sorted.filter((a) => matchesTab(a, "issued")).length,
  };

  const rows = sorted.filter((application) => matchesTab(application, tab));

  const columns: Column<ApplicationRecord>[] = [
    {
      key: "reference",
      header: "Reference",
      cell: (application) => (
        <span className="font-semibold text-text-dark">{application.reference}</span>
      ),
    },
    { key: "permitType", header: "Permit Type", cell: (application) => application.permitKind },
    { key: "operator", header: "Operator", cell: () => operator.company },
    {
      key: "aircraft",
      header: "Aircraft",
      cell: (application) => getAircraft(world, application.aircraftId).registration,
    },
    {
      key: "route",
      header: "Route",
      cell: (application) =>
        `${application.route.originIcao} → ${application.route.destinationIcao}`,
    },
    {
      key: "submitted",
      header: "Submitted",
      cell: (application) => (application.submittedAt ? formatDate(application.submittedAt) : "—"),
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
        <Button
          variant="outline"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            navigate({
              to: "/operator/applications/$reference",
              params: { reference: application.reference },
            });
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <PortalPage
      title="My Applications"
      description="Track every permit application you have created and its position in the authority workflow."
      breadcrumb={[{ label: "Operator" }, { label: "Applications" }]}
      actions={
        <Button onClick={() => navigate({ to: "/operator/apply" })}>
          <FileText size={15} /> New application
        </Button>
      }
      tabs={
        <UnderlineTabs
          value={tab}
          onChange={(key) => setTab(key as TabKey)}
          tabs={[
            { key: "all", label: "All", count: counts.all },
            { key: "draft", label: "Draft", count: counts.draft },
            { key: "pending", label: "In Progress", count: counts.pending },
            { key: "approved", label: "Approved", count: counts.approved },
            { key: "issued", label: "Issued", count: counts.issued },
          ]}
        />
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile label="Total applications" value={counts.all} icon={ClipboardList} tone="info" />
          <KpiTile label="In progress" value={counts.pending} icon={FileClock} tone="warning" />
          <KpiTile label="Approved" value={counts.approved} icon={CheckCircle2} tone="success" />
          <KpiTile label="Permits issued" value={counts.issued} icon={FileText} tone="success" />
        </div>

        <SectionCard padded={false}>
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(application) => application.id}
            onRowClick={(application) =>
              navigate({
                to: "/operator/applications/$reference",
                params: { reference: application.reference },
              })
            }
            emptyTitle="No applications in this view"
            emptyDescription="Create a new permit application to get started."
          />
        </SectionCard>
      </div>
    </PortalPage>
  );
}
