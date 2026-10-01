import { Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, FilePlus, FileText, PencilLine, Send } from "lucide-react";
import {
  ApplicationStatusBadge,
  DataTable,
  DocumentStatusBadge,
  KpiTile,
  PortalPage,
  SectionCard,
  type Column,
} from "@/components/desktop";
import type {
  ApplicationRecord,
  ApplicationStatus,
  DocumentRecord,
  DocumentStatus,
} from "@/data/types";
import { formatDate, useDocuments, useOperator, useOperatorApplications, useWorld } from "@/store";

const DRAFT_STATUSES: readonly ApplicationStatus[] = ["DRAFT"];
const PENDING_STATUSES: readonly ApplicationStatus[] = [
  "SUBMITTED",
  "UNDER REVIEW",
  "AWAITING FINANCE",
  "TECHNICAL REVIEW",
  "AWAITING FINAL APPROVAL",
  "REVISION REQUESTED",
  "RETURNED",
];
const APPROVED_STATUSES: readonly ApplicationStatus[] = ["APPROVED", "ISSUED", "REISSUED"];
const EXPIRING_STATUSES: readonly DocumentStatus[] = [
  "EXPIRING SOON",
  "EXPIRED",
  "REJECTED",
  "MISSING",
];

export function PermitOfficerDashboard() {
  const navigate = useNavigate();
  const world = useWorld();
  const operator = useOperator();
  const applications = useOperatorApplications();
  const documents = useDocuments();

  const operatorAircraftIds = new Set(
    world.aircraft.filter((item) => item.operatorId === operator.id).map((item) => item.id),
  );
  const operatorApplicationIds = new Set(applications.map((item) => item.id));

  const ownedDocuments = documents.filter((document) => {
    if (document.ownerType === "operator") return document.ownerId === operator.id;
    if (document.ownerType === "aircraft") return operatorAircraftIds.has(document.ownerId);
    return operatorApplicationIds.has(document.ownerId);
  });

  const drafts = applications.filter((application) =>
    DRAFT_STATUSES.includes(application.status),
  ).length;
  const pending = applications.filter((application) =>
    PENDING_STATUSES.includes(application.status),
  ).length;
  const approved = applications.filter((application) =>
    APPROVED_STATUSES.includes(application.status),
  ).length;

  const expiringDocuments = ownedDocuments.filter((document) =>
    EXPIRING_STATUSES.includes(document.status),
  );

  const applicationColumns: Column<ApplicationRecord>[] = [
    {
      key: "reference",
      header: "Reference",
      cell: (application) => (
        <Link
          to="/operator/applications/$reference"
          params={{ reference: application.reference }}
          className="font-semibold text-accent hover:underline"
          onClick={(event) => event.stopPropagation()}
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

  const documentColumns: Column<DocumentRecord>[] = [
    {
      key: "name",
      header: "Document",
      cell: (document) => <span className="font-semibold text-text-dark">{document.name}</span>,
    },
    { key: "category", header: "Category", cell: (document) => document.category },
    { key: "expiry", header: "Expiry", cell: (document) => formatDate(document.expiry) },
    {
      key: "status",
      header: "Status",
      cell: (document) => <DocumentStatusBadge status={document.status} />,
    },
  ];

  return (
    <PortalPage
      title="Permit Desk"
      description="Prepare and track permit applications for the operator, and keep supporting documents current."
      breadcrumb={[{ label: "Operator" }, { label: "Permit Desk" }]}
      actions={
        <button
          type="button"
          onClick={() => navigate({ to: "/operator/apply" })}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-accent-foreground transition-colors hover:bg-accent-pressed"
        >
          <FilePlus size={15} /> Apply for Permit
        </button>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile
            label="My applications"
            value={applications.length}
            hint="All applications on this account"
            icon={FileText}
            tone="info"
            onClick={() => navigate({ to: "/operator/applications" })}
          />
          <KpiTile
            label="Drafts"
            value={drafts}
            hint="Not yet submitted"
            icon={PencilLine}
            tone="default"
            onClick={() => navigate({ to: "/operator/applications" })}
          />
          <KpiTile
            label="Pending review"
            value={pending}
            hint="Moving through the workflow"
            icon={Send}
            tone="warning"
            onClick={() => navigate({ to: "/operator/applications" })}
          />
          <KpiTile
            label="Approved"
            value={approved}
            hint="Approved, issued or reissued"
            icon={CheckCircle2}
            tone="success"
            onClick={() => navigate({ to: "/operator/applications" })}
          />
        </div>

        <SectionCard
          title="My applications"
          description="Every permit application on this operator account and its current stage."
          actions={
            <Link
              to="/operator/applications"
              className="text-[12px] font-semibold text-accent hover:underline"
            >
              View all
            </Link>
          }
          padded={false}
        >
          <DataTable
            columns={applicationColumns}
            rows={applications}
            getRowKey={(application) => application.id}
            onRowClick={(application) =>
              navigate({
                to: "/operator/applications/$reference",
                params: { reference: application.reference },
              })
            }
            emptyTitle="No applications yet"
            emptyDescription="Start a new permit application to track it here."
          />
        </SectionCard>

        <SectionCard
          title="Documents expiring soon"
          description="Supporting documents that are expiring, expired or were rejected."
          actions={
            <Link
              to="/operator/documents"
              className="text-[12px] font-semibold text-accent hover:underline"
            >
              Manage documents
            </Link>
          }
          padded={false}
        >
          <DataTable
            columns={documentColumns}
            rows={expiringDocuments}
            getRowKey={(document) => document.id}
            emptyTitle="Everything is current"
            emptyDescription="No documents require attention right now."
          />
        </SectionCard>
      </div>
    </PortalPage>
  );
}
