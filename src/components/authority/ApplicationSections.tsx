import {
  Checklist,
  ClearanceBadge,
  DataTable,
  DescriptionList,
  DocumentStatusBadge,
  PaymentBadge,
  SectionCard,
  ValidationBadge,
  type Column,
} from "@/components/desktop";
import { operatorName } from "@/data";
import type { ApplicationRecord, DocumentRecord } from "@/data/types";
import {
  formatDate,
  formatDateTime,
  useAircraftItem,
  useAgentItem,
  useDocuments,
  useWorld,
} from "@/store";

type ApplicationSectionsProps = {
  application: ApplicationRecord;
};

/**
 * Read-only summary of an application, reused by the reviewer workspace,
 * the technical review screen and any other authority detail surface.
 */
export function ApplicationSections({ application }: ApplicationSectionsProps) {
  const world = useWorld();
  const documents = useDocuments();
  const aircraft = useAircraftItem(application.aircraftId);
  const agent = useAgentItem(application.agentId);

  const isHomeOperator = world.operator.id === application.operatorId;
  const applicationDocuments = documents.filter((document) =>
    application.documentIds.includes(document.id),
  );

  const documentColumns: Column<DocumentRecord>[] = [
    {
      key: "name",
      header: "Document",
      cell: (document) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-text-dark">{document.name}</div>
          <div className="text-[11px] text-text-subtle">{document.category}</div>
        </div>
      ),
    },
    {
      key: "reference",
      header: "Reference",
      cell: (document) => <span className="text-text-muted">{document.reference}</span>,
    },
    {
      key: "version",
      header: "Version",
      align: "center",
      cell: (document) => `v${document.version}`,
    },
    {
      key: "expiry",
      header: "Expiry",
      cell: (document) => formatDate(document.expiry),
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      cell: (document) => <DocumentStatusBadge status={document.status} />,
    },
  ];

  return (
    <div className="space-y-5">
      <SectionCard title="Summary" description="Application identity and current stage.">
        <DescriptionList
          columns={3}
          items={[
            { label: "Reference", value: application.reference },
            {
              label: "Status",
              value: <span className="font-semibold">{application.status}</span>,
            },
            { label: "Permit kind", value: application.permitKind },
            { label: "Authorization", value: application.authorization },
            { label: "Category", value: application.category },
            {
              label: "Submitted",
              value: application.submittedAt
                ? formatDateTime(application.submittedAt)
                : "Not submitted",
            },
            {
              label: "Assigned reviewer",
              value: application.assignedReviewer,
              fullWidth: true,
            },
          ]}
        />
      </SectionCard>

      <SectionCard title="Operator" description="Applicant on record and any authorised agent.">
        <DescriptionList
          columns={3}
          items={[
            { label: "Company", value: operatorName(world, application.operatorId) },
            {
              label: "Operator ID",
              value: isHomeOperator ? world.operator.operatorId : "—",
            },
            {
              label: "Country",
              value: isHomeOperator ? world.operator.country : "—",
            },
            {
              label: "AOC number",
              value: isHomeOperator ? world.operator.aocNumber : "—",
            },
            {
              label: "AOC valid until",
              value: isHomeOperator ? formatDate(world.operator.aocValidUntil) : "—",
            },
            {
              label: "Agent",
              value: agent ? `${agent.name} (${agent.agentId})` : "Direct submission",
            },
          ]}
        />
      </SectionCard>

      <SectionCard title="Aircraft" description="Airframe assigned to this application.">
        <DescriptionList
          columns={3}
          items={[
            { label: "Registration", value: aircraft?.registration ?? "—" },
            { label: "Type", value: aircraft?.type ?? "—" },
            {
              label: "MTOW",
              value: aircraft ? `${aircraft.mtowKg.toLocaleString()} kg` : "—",
            },
            {
              label: "Registration certificate",
              value: aircraft ? (
                <DocumentStatusBadge status={aircraft.certificates.registration.status} />
              ) : (
                "—"
              ),
            },
            {
              label: "Airworthiness",
              value: aircraft ? (
                <DocumentStatusBadge status={aircraft.certificates.airworthiness.status} />
              ) : (
                "—"
              ),
            },
            {
              label: "Insurance",
              value: aircraft ? (
                <DocumentStatusBadge status={aircraft.certificates.insurance.status} />
              ) : (
                "—"
              ),
            },
          ]}
        />
      </SectionCard>

      <SectionCard title="Flight" description="Flight category and operational detail.">
        <DescriptionList
          columns={3}
          items={[
            { label: "Flight number", value: application.flight.flightNumber },
            { label: "Call sign", value: application.flight.callSign },
            { label: "Passengers", value: application.flight.passengerCount },
            { label: "Cargo", value: application.flight.cargo },
            { label: "Purpose", value: application.flight.purpose, fullWidth: true },
          ]}
        />
      </SectionCard>

      <SectionCard title="Route & Schedule" description="Authorised routing and time window.">
        <DescriptionList
          columns={3}
          items={[
            {
              label: "Origin",
              value: `${application.route.origin} (${application.route.originIcao})`,
            },
            {
              label: "Destination",
              value: `${application.route.destination} (${application.route.destinationIcao})`,
            },
            { label: "Entry point", value: application.route.entryPoint },
            { label: "Exit point", value: application.route.exitPoint },
            { label: "Departure (UTC)", value: formatDateTime(application.route.departureAt) },
            { label: "Arrival (UTC)", value: formatDateTime(application.route.arrivalAt) },
          ]}
        />
      </SectionCard>

      <SectionCard
        title="Documents"
        description={`${applicationDocuments.length} documents attached to this application.`}
        padded={false}
      >
        <DataTable
          columns={documentColumns}
          rows={applicationDocuments}
          getRowKey={(document) => document.id}
          emptyTitle="No documents attached"
          emptyDescription="This application has no documents on record."
        />
      </SectionCard>

      <SectionCard
        title="Validation"
        description="Automated compliance checks recorded at submission."
        actions={<ValidationBadge outcome={application.validationResult} />}
      >
        <Checklist
          items={application.validation.map((check) => ({
            id: check.id,
            label: check.label,
            detail: check.detail,
            outcome: check.outcome,
          }))}
        />
      </SectionCard>

      <SectionCard title="Finance" description="Fees and settlement status.">
        <div className="mb-4 flex items-center gap-2">
          <PaymentBadge status={application.finance.paymentStatus} />
          <ClearanceBadge status={application.finance.financialClearance} />
        </div>
        <DescriptionList
          columns={3}
          items={[
            {
              label: "Permit fee",
              value: `${application.finance.currency} ${application.finance.permitFee.toLocaleString()}`,
            },
            {
              label: "Processing fee",
              value: `${application.finance.currency} ${application.finance.processingFee.toLocaleString()}`,
            },
            {
              label: "Total",
              value: `${application.finance.currency} ${(
                application.finance.permitFee + application.finance.processingFee
              ).toLocaleString()}`,
            },
            {
              label: "Payment method",
              value: application.finance.paymentMethod ?? "Not selected",
            },
            {
              label: "Paid at",
              value: application.finance.paidAt ? formatDateTime(application.finance.paidAt) : "—",
            },
            { label: "Hold reason", value: application.finance.holdReason ?? "None" },
          ]}
        />
      </SectionCard>
    </div>
  );
}
