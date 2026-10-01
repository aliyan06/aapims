import { useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, FileCheck2, Stamp } from "lucide-react";
import {
  ApplicationStatusBadge,
  DataTable,
  KpiTile,
  PortalPage,
  SectionCard,
  type Column,
} from "@/components/desktop";
import { Button } from "@/components/ui/button";
import type { ApplicationRecord } from "@/data/types";
import { getAircraft, operatorName } from "@/data/lookups";
import { useApplications, useWorld } from "@/store";

export const Route = createFileRoute("/authority/approval/")({
  component: ApprovalQueue,
});

function ApprovalQueue() {
  const navigate = useNavigate();
  const world = useWorld();
  const applications = useApplications();

  const rows = useMemo(
    () =>
      applications.filter(
        (application) =>
          application.status === "AWAITING FINAL APPROVAL" ||
          application.status === "APPROVED" ||
          application.status === "ISSUED" ||
          application.status === "REISSUED",
      ),
    [applications],
  );

  const awaitingCount = applications.filter(
    (application) => application.status === "AWAITING FINAL APPROVAL",
  ).length;
  const approvedCount = applications.filter(
    (application) => application.status === "APPROVED",
  ).length;
  const issuedCount = applications.filter(
    (application) => application.status === "ISSUED" || application.status === "REISSUED",
  ).length;

  const columns: Column<ApplicationRecord>[] = [
    {
      key: "reference",
      header: "Reference",
      cell: (application) => (
        <span className="font-semibold text-text-dark">{application.reference}</span>
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
    { key: "flight", header: "Flight", cell: (application) => application.flight.flightNumber },
    {
      key: "route",
      header: "Route",
      cell: (application) => `${application.route.origin} → ${application.route.destination}`,
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
              to: "/authority/approval/$reference",
              params: { reference: application.reference },
            });
          }}
        >
          Open
        </Button>
      ),
    },
  ];

  return (
    <PortalPage
      title="Permit Approval"
      description="Approve applications that passed technical review and issue the digital e-permit."
      breadcrumb={[{ label: "Authority" }, { label: "Approval" }]}
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiTile
            label="Awaiting approval"
            value={awaitingCount}
            hint="Ready for the final decision"
            icon={Stamp}
            tone="warning"
          />
          <KpiTile
            label="Approved"
            value={approvedCount}
            hint="Approved, awaiting issuance"
            icon={FileCheck2}
            tone="info"
          />
          <KpiTile
            label="Issued"
            value={issuedCount}
            hint="Digital permits issued"
            icon={BadgeCheck}
            tone="success"
          />
        </div>

        <SectionCard
          title="Approval queue"
          description="Applications awaiting final approval plus recently approved and issued permits."
          padded={false}
        >
          <DataTable
            columns={columns}
            rows={rows}
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
      </div>
    </PortalPage>
  );
}
