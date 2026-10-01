import { Link } from "@tanstack/react-router";
import { CheckCircle2, Clock, Eye, FileText, ShieldCheck } from "lucide-react";
import {
  ApplicationStatusBadge,
  DataTable,
  KpiTile,
  PortalPage,
  SectionCard,
  StatusBadge,
  type Column,
} from "@/components/desktop";
import type { ApplicationRecord, ApplicationStatus, PermitRecord } from "@/data/types";
import type { StatusTone } from "@/lib/status";
import { formatDate, useOperator, useOperatorApplications, usePermits } from "@/store";

const PENDING_STATUSES: readonly ApplicationStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER REVIEW",
  "AWAITING FINANCE",
  "TECHNICAL REVIEW",
  "AWAITING FINAL APPROVAL",
  "REVISION REQUESTED",
  "RETURNED",
];
const APPROVED_STATUSES: readonly ApplicationStatus[] = ["APPROVED", "ISSUED", "REISSUED"];

const PERMIT_TONE: Record<PermitRecord["status"], StatusTone> = {
  ISSUED: "issued",
  ACTIVE: "approved",
  REISSUED: "issued",
  EXPIRED: "expired",
  REVOKED: "rejected",
};

export function ViewerDashboard() {
  const operator = useOperator();
  const applications = useOperatorApplications();
  const permits = usePermits();

  const operatorPermits = permits.filter((permit) => permit.operatorId === operator.id);

  const pending = applications.filter((application) =>
    PENDING_STATUSES.includes(application.status),
  ).length;
  const approved = applications.filter((application) =>
    APPROVED_STATUSES.includes(application.status),
  ).length;

  const applicationColumns: Column<ApplicationRecord>[] = [
    {
      key: "reference",
      header: "Reference",
      cell: (application) => (
        <Link
          to="/operator/applications/$reference"
          params={{ reference: application.reference }}
          className="font-semibold text-accent hover:underline"
        >
          {application.reference}
        </Link>
      ),
    },
    { key: "permitType", header: "Permit Type", cell: (application) => application.permitKind },
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

  const permitColumns: Column<PermitRecord>[] = [
    {
      key: "permitNumber",
      header: "Permit",
      cell: (permit) => (
        <Link
          to="/operator/permits/$permitNumber"
          params={{ permitNumber: permit.permitNumber }}
          className="font-semibold text-accent hover:underline"
        >
          {permit.permitNumber}
        </Link>
      ),
    },
    { key: "route", header: "Route", cell: (permit) => permit.routeLabel },
    { key: "validUntil", header: "Valid Until", cell: (permit) => formatDate(permit.validUntil) },
    {
      key: "status",
      header: "Status",
      cell: (permit) => <StatusBadge label={permit.status} tone={PERMIT_TONE[permit.status]} />,
    },
  ];

  return (
    <PortalPage
      title="Operator Overview (read-only)"
      description={`A read-only view of ${operator.company}'s permit applications and permits.`}
      breadcrumb={[{ label: "Operator" }, { label: "Overview" }]}
      actions={<StatusBadge label="Viewer — read-only access" tone="draft" />}
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile
            label="Applications"
            value={applications.length}
            hint="All applications on this account"
            icon={FileText}
            tone="info"
          />
          <KpiTile
            label="Pending"
            value={pending}
            hint="In progress or awaiting action"
            icon={Clock}
            tone="warning"
          />
          <KpiTile
            label="Approved"
            value={approved}
            hint="Approved, issued or reissued"
            icon={CheckCircle2}
            tone="success"
          />
          <KpiTile
            label="Permits"
            value={operatorPermits.length}
            hint="Issued permits on record"
            icon={ShieldCheck}
            tone="default"
          />
        </div>

        <SectionCard
          title="Applications"
          description="Permit applications on the operator account."
          padded={false}
        >
          <DataTable
            columns={applicationColumns}
            rows={applications}
            getRowKey={(application) => application.id}
            emptyTitle="No applications"
            emptyDescription="There are no permit applications to display."
          />
        </SectionCard>

        <SectionCard title="Permits" description="Permits issued to the operator." padded={false}>
          <DataTable
            columns={permitColumns}
            rows={operatorPermits}
            getRowKey={(permit) => permit.id}
            emptyTitle="No permits"
            emptyDescription="There are no permits to display."
          />
        </SectionCard>

        <p className="flex items-center gap-2 text-[12px] text-text-subtle">
          <Eye size={14} /> Viewer accounts can browse applications and permits but cannot make
          changes.
        </p>
      </div>
    </PortalPage>
  );
}
