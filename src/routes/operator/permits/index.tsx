import { useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, FileCheck2, RefreshCw, ShieldCheck } from "lucide-react";
import { DataTable, KpiTile, PortalPage, SectionCard, type Column } from "@/components/desktop";
import { Button } from "@/components/ui/button";
import type { PermitRecord } from "@/data";
import { getAircraft, operatorName } from "@/data/lookups";
import { formatDate, useOperator, usePermits, useWorld } from "@/store";

export const Route = createFileRoute("/operator/permits/")({
  component: PermitsIndex,
});

function PermitsIndex() {
  const navigate = useNavigate();
  const world = useWorld();
  const operator = useOperator();
  const permits = usePermits();

  const operatorPermits = useMemo(
    () => permits.filter((permit) => permit.operatorId === operator.id),
    [permits, operator.id],
  );

  const activeCount = operatorPermits.filter(
    (permit) => permit.status === "ISSUED" || permit.status === "ACTIVE",
  ).length;
  const reissuedCount = operatorPermits.filter(
    (permit) => permit.status === "REISSUED" || permit.version > 1,
  ).length;
  const awaitingIssueCount = world.applications.filter(
    (application) => application.operatorId === operator.id && application.status === "APPROVED",
  ).length;

  const columns: Column<PermitRecord>[] = [
    {
      key: "permitNumber",
      header: "Permit Number",
      cell: (permit) => <span className="font-semibold text-text-dark">{permit.permitNumber}</span>,
    },
    {
      key: "operator",
      header: "Operator",
      cell: (permit) => operatorName(world, permit.operatorId),
    },
    {
      key: "aircraft",
      header: "Aircraft",
      cell: (permit) => getAircraft(world, permit.aircraftId).registration,
    },
    { key: "flight", header: "Flight", cell: (permit) => permit.flightNumber },
    { key: "route", header: "Route", cell: (permit) => permit.routeLabel },
    { key: "validFrom", header: "Valid From", cell: (permit) => formatDate(permit.validFrom) },
    { key: "validUntil", header: "Valid Until", cell: (permit) => formatDate(permit.validUntil) },
    { key: "status", header: "Status", cell: (permit) => permit.status },
    { key: "version", header: "Version", cell: (permit) => `V${permit.version}` },
    {
      key: "action",
      header: "",
      align: "right",
      cell: (permit) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            navigate({
              to: "/operator/permits/$permitNumber",
              params: { permitNumber: permit.permitNumber },
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
      title="My Permits"
      description="Issued digital e-permits for your fleet, with validity windows and revision versions."
      breadcrumb={[{ label: "Operator" }, { label: "Permits" }]}
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile
            label="Total permits"
            value={operatorPermits.length}
            icon={ShieldCheck}
            tone="info"
          />
          <KpiTile label="Active / issued" value={activeCount} icon={BadgeCheck} tone="success" />
          <KpiTile label="Reissued (V2+)" value={reissuedCount} icon={RefreshCw} tone="revision" />
          <KpiTile
            label="Awaiting issue"
            value={awaitingIssueCount}
            icon={FileCheck2}
            tone="warning"
          />
        </div>

        <SectionCard padded={false}>
          <DataTable
            columns={columns}
            rows={operatorPermits}
            getRowKey={(permit) => permit.id}
            onRowClick={(permit) =>
              navigate({
                to: "/operator/permits/$permitNumber",
                params: { permitNumber: permit.permitNumber },
              })
            }
            emptyTitle="No permits issued yet"
            emptyDescription="Once the authority issues a permit, it will appear here."
          />
        </SectionCard>
      </div>
    </PortalPage>
  );
}
