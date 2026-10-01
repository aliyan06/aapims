import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, Ban, CalendarX, RefreshCw } from "lucide-react";
import {
  DataTable,
  KpiTile,
  PortalPage,
  SectionCard,
  StatusBadge,
  UnderlineTabs,
  type Column,
  type UnderlineTab,
} from "@/components/desktop";
import type { PermitRecord } from "@/data/types";
import { getAircraft, operatorName } from "@/data/lookups";
import { formatDate, usePermits, useWorld } from "@/store";
import type { StatusTone } from "@/lib/status";

export const Route = createFileRoute("/authority/permits/")({
  component: AuthorityPermits,
});

const PERMIT_STATUS_TONE: Record<PermitRecord["status"], StatusTone> = {
  ISSUED: "issued",
  ACTIVE: "issued",
  REISSUED: "issued",
  EXPIRED: "expired",
  REVOKED: "rejected",
};

type StatusFilter = "ALL" | PermitRecord["status"];

const FILTERS: StatusFilter[] = ["ALL", "ISSUED", "REISSUED", "EXPIRED", "REVOKED"];

function AuthorityPermits() {
  const navigate = useNavigate();
  const world = useWorld();
  const permits = usePermits();
  const [filter, setFilter] = useState<StatusFilter>("ALL");

  const tabs: UnderlineTab[] = FILTERS.map((key) => ({
    key,
    label: key === "ALL" ? "All permits" : key,
    count:
      key === "ALL" ? permits.length : permits.filter((permit) => permit.status === key).length,
  }));

  const rows = useMemo(
    () => (filter === "ALL" ? permits : permits.filter((permit) => permit.status === filter)),
    [permits, filter],
  );

  const issuedCount = permits.filter(
    (permit) => permit.status === "ISSUED" || permit.status === "ACTIVE",
  ).length;
  const reissuedCount = permits.filter((permit) => permit.status === "REISSUED").length;
  const expiredCount = permits.filter((permit) => permit.status === "EXPIRED").length;
  const revokedCount = permits.filter((permit) => permit.status === "REVOKED").length;

  const columns: Column<PermitRecord>[] = [
    {
      key: "permitNumber",
      header: "Permit Number",
      cell: (permit) => <span className="font-semibold text-text-dark">{permit.permitNumber}</span>,
    },
    {
      key: "reference",
      header: "Application Reference",
      cell: (permit) => permit.applicationReference,
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
    {
      key: "status",
      header: "Status",
      cell: (permit) => (
        <StatusBadge label={permit.status} tone={PERMIT_STATUS_TONE[permit.status]} />
      ),
    },
    { key: "version", header: "Version", cell: (permit) => `V${permit.version}` },
  ];

  return (
    <PortalPage
      title="Issued Permits"
      description="All digital e-permits issued by the authority, including reissues, expiries and revocations."
      breadcrumb={[{ label: "Authority" }, { label: "Permits" }]}
      tabs={
        <UnderlineTabs
          tabs={tabs}
          value={filter}
          onChange={(key) => setFilter(key as StatusFilter)}
        />
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile label="Issued / active" value={issuedCount} icon={BadgeCheck} tone="success" />
          <KpiTile label="Reissued" value={reissuedCount} icon={RefreshCw} tone="revision" />
          <KpiTile label="Expired" value={expiredCount} icon={CalendarX} tone="warning" />
          <KpiTile label="Revoked" value={revokedCount} icon={Ban} tone="danger" />
        </div>

        <SectionCard
          title="Permit register"
          description={`${rows.length} permit${rows.length === 1 ? "" : "s"} in the selected view.`}
          padded={false}
        >
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(permit) => permit.id}
            onRowClick={(permit) =>
              navigate({
                to: "/authority/permits/$permitNumber",
                params: { permitNumber: permit.permitNumber },
              })
            }
            emptyTitle="No permits in this view"
            emptyDescription="Permits appear here once the authority issues them."
          />
        </SectionCard>
      </div>
    </PortalPage>
  );
}
