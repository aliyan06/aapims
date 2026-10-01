import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, FileWarning } from "lucide-react";
import {
  ApplicationStatusBadge,
  Checklist,
  ClearanceBadge,
  DescriptionList,
  DocumentStatusBadge,
  EmptyState,
  PaymentBadge,
  PortalPage,
  SectionCard,
  Timeline,
  ValidationBadge,
  type DescriptionItem,
  type TimelineStep,
} from "@/components/desktop";
import { Button } from "@/components/ui/button";
import type { ApplicationRecord, ApplicationStatus } from "@/data";
import { operatorName } from "@/data/lookups";
import {
  formatDate,
  formatDateTime,
  useAircraftItem,
  useAgentItem,
  useApplication,
  useDocuments,
  usePermit,
  useWorld,
} from "@/store";

export const Route = createFileRoute("/operator/applications/$reference")({
  component: ApplicationDetail,
});

const LIFECYCLE: readonly ApplicationStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER REVIEW",
  "AWAITING FINANCE",
  "TECHNICAL REVIEW",
  "AWAITING FINAL APPROVAL",
  "APPROVED",
  "ISSUED",
];

function buildTimeline(application: ApplicationRecord): TimelineStep[] {
  const directIndex = LIFECYCLE.indexOf(application.status);
  const lastKnown = [...application.history]
    .reverse()
    .find((entry) => LIFECYCLE.includes(entry.status));
  const currentIndex =
    directIndex >= 0 ? directIndex : lastKnown ? LIFECYCLE.indexOf(lastKnown.status) : 0;

  return LIFECYCLE.map((status, index) => {
    const history = [...application.history].reverse().find((entry) => entry.status === status);
    let state: TimelineStep["state"] = "pending";
    if (directIndex >= 0) {
      state = index < currentIndex ? "done" : index === currentIndex ? "current" : "pending";
    } else if (index < currentIndex) {
      state = "done";
    } else if (index === currentIndex) {
      state = "error";
    }
    return {
      label: status,
      state,
      timestamp: history ? formatDateTime(history.at) : undefined,
      by: history?.by,
      note: history?.note,
    };
  });
}

function ApplicationDetail() {
  const { reference } = Route.useParams();
  const navigate = useNavigate();
  const world = useWorld();
  const application = useApplication(reference);
  const permit = usePermit(application?.permitId ?? "");
  const aircraft = useAircraftItem(application?.aircraftId ?? "");
  const agent = useAgentItem(application?.agentId ?? null);
  const documents = useDocuments();

  if (!application) {
    return (
      <PortalPage
        title="Application not found"
        breadcrumb={[{ label: "Applications", to: "/operator/applications" }]}
      >
        <EmptyState
          icon={FileWarning}
          title="Unknown application reference"
          description={`No application matches ${reference}.`}
          action={
            <Button onClick={() => navigate({ to: "/operator/applications" })}>
              Back to applications
            </Button>
          }
        />
      </PortalPage>
    );
  }

  const applicationDocuments = documents.filter((document) =>
    application.documentIds.includes(document.id),
  );

  const { flight, route } = application;
  const { finance } = application;

  const manifestItems: DescriptionItem[] = [];
  if (flight.passengerManifest) {
    manifestItems.push(
      { label: "Passenger manifest", value: flight.passengerManifest },
      { label: "Receiving party", value: flight.receivingParty ?? "—" },
      { label: "Receiving party contact", value: flight.receivingPartyContact ?? "—" },
    );
  }
  if (flight.cargoManifest) {
    manifestItems.push(
      { label: "Cargo manifest", value: flight.cargoManifest },
      { label: "Shipper", value: flight.shipper ?? "—" },
      { label: "Consignee", value: flight.consignee ?? "—" },
      { label: "Air waybill", value: flight.airWaybill ?? "—" },
    );
  }

  const routeItems: DescriptionItem[] = [
    { label: "Origin", value: `${route.origin} (${route.originIcao})` },
    { label: "Destination", value: `${route.destination} (${route.destinationIcao})` },
    { label: "Entry point", value: route.entryPoint },
    { label: "Exit point", value: route.exitPoint },
    { label: "Departure (UTC)", value: formatDateTime(route.departureAt) },
    { label: "Arrival (UTC)", value: formatDateTime(route.arrivalAt) },
    {
      label: "Estimated entry",
      value: route.estimatedEntryAt ? formatDateTime(route.estimatedEntryAt) : "—",
    },
    {
      label: "Estimated exit",
      value: route.estimatedExitAt ? formatDateTime(route.estimatedExitAt) : "—",
    },
    { label: "Timezone", value: route.timezone },
  ];
  if (application.authorization === "LANDING") {
    routeItems.push(
      { label: "Departure slot", value: route.departureSlot ?? "—" },
      { label: "Arrival slot", value: route.arrivalSlot ?? "—" },
      { label: "Ground handling", value: route.groundHandlingAgent ?? "—" },
      { label: "Purpose of visit", value: route.purposeOfVisit ?? "—" },
    );
  }

  return (
    <PortalPage
      title={application.reference}
      description={`${application.permitKind} · ${application.category}`}
      breadcrumb={[
        { label: "Applications", to: "/operator/applications" },
        { label: application.reference },
      ]}
      actions={<ApplicationStatusBadge status={application.status} />}
    >
      <div className="space-y-5">
        {application.status === "RETURNED" ? (
          <div className="flex items-start gap-3 rounded-xl border border-status-returned/30 bg-status-returned-soft px-4 py-3">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-status-returned" />
            <div>
              <p className="text-[13px] font-bold text-text-dark">Returned for correction</p>
              <p className="text-[12px] text-text-muted">
                The authority requires changes before this application can continue. Review the
                notes and resubmit.
              </p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <SectionCard title="Operator" description="Applicant on record.">
              <DescriptionList
                columns={2}
                items={[
                  { label: "Company", value: operatorName(world, application.operatorId) },
                  { label: "Operator ID", value: world.operator.operatorId },
                  {
                    label: "Agent",
                    value: agent ? `${agent.name} (${agent.agentId})` : "Direct submission",
                  },
                  { label: "Assigned reviewer", value: application.assignedReviewer },
                ]}
              />
            </SectionCard>

            <SectionCard title="Aircraft" description="Airframe assigned to this application.">
              <DescriptionList
                columns={2}
                items={[
                  { label: "Registration", value: aircraft?.registration ?? "—" },
                  { label: "Type", value: aircraft?.type ?? "—" },
                  {
                    label: "MTOW",
                    value: aircraft ? `${aircraft.mtowKg.toLocaleString()} kg` : "—",
                  },
                  {
                    label: "Airworthiness",
                    value: aircraft ? (
                      <DocumentStatusBadge status={aircraft.certificates.airworthiness.status} />
                    ) : (
                      "—"
                    ),
                  },
                ]}
              />
            </SectionCard>

            <SectionCard title="Flight" description="Category and operational detail.">
              <DescriptionList
                columns={3}
                items={[
                  { label: "Authorization", value: application.authorization },
                  { label: "Permit kind", value: application.permitKind },
                  { label: "Category", value: application.category },
                  { label: "Flight number", value: flight.flightNumber },
                  { label: "Call sign", value: flight.callSign },
                  { label: "Passengers", value: flight.passengerCount },
                  { label: "Cargo", value: flight.cargo },
                  { label: "Purpose", value: flight.purpose, fullWidth: true },
                  {
                    label: "Special information",
                    value: flight.specialInfo ?? "None recorded",
                    fullWidth: true,
                  },
                ]}
              />
            </SectionCard>

            <SectionCard
              title="PAX / Cargo Manifest"
              description="Manifest and receiving party detail for this flight."
            >
              {manifestItems.length > 0 ? (
                <DescriptionList columns={3} items={manifestItems} />
              ) : (
                <p className="text-[13px] text-text-muted">
                  No passenger or cargo manifest recorded for this application.
                </p>
              )}
            </SectionCard>

            <SectionCard title="Route & Schedule" description="Authorised routing and time window.">
              <DescriptionList columns={3} items={routeItems} />
            </SectionCard>

            <SectionCard
              title="Documents"
              description={`${applicationDocuments.length} documents attached to this application.`}
            >
              <ul className="space-y-2">
                {applicationDocuments.map((document) => (
                  <li
                    key={document.id}
                    className="flex items-center justify-between gap-4 rounded-lg border border-border-soft px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-text-dark">
                        {document.name}
                      </p>
                      <p className="text-[12px] text-text-subtle">
                        {document.reference} · expires {formatDate(document.expiry)}
                      </p>
                    </div>
                    <DocumentStatusBadge status={document.status} />
                  </li>
                ))}
              </ul>
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
                <PaymentBadge status={finance.paymentStatus} />
                <ClearanceBadge status={finance.financialClearance} />
              </div>
              <DescriptionList
                columns={3}
                items={[
                  {
                    label: "Permit fee",
                    value: `${finance.currency} ${finance.permitFee.toLocaleString()}`,
                  },
                  {
                    label: "Processing fee",
                    value: `${finance.currency} ${finance.processingFee.toLocaleString()}`,
                  },
                  {
                    label: "Total",
                    value: `${finance.currency} ${(
                      finance.permitFee + finance.processingFee
                    ).toLocaleString()}`,
                  },
                  {
                    label: "Payment method",
                    value: finance.paymentMethod ?? "Not selected",
                  },
                  {
                    label: "Paid at",
                    value: finance.paidAt ? formatDateTime(finance.paidAt) : "—",
                  },
                  { label: "Billing model", value: finance.billingModel },
                  { label: "Invoice number", value: finance.invoiceNumber ?? "—" },
                  {
                    label: "Due date",
                    value: finance.dueDate ? formatDate(finance.dueDate) : "—",
                  },
                  {
                    label: "Outstanding",
                    value: `${finance.currency} ${(finance.outstanding ?? 0).toLocaleString()}`,
                  },
                  { label: "Hold reason", value: finance.holdReason ?? "None" },
                ]}
              />
            </SectionCard>
          </div>

          <div className="space-y-5">
            <SectionCard title="Lifecycle" description="Position in the authority workflow.">
              <Timeline steps={buildTimeline(application)} />
            </SectionCard>

            {permit ? (
              <SectionCard
                title="Digital Permit"
                description="Issued e-permit for this application."
              >
                <div className="space-y-3">
                  <DescriptionList
                    columns={1}
                    items={[
                      { label: "Permit number", value: permit.permitNumber },
                      { label: "Status", value: permit.status },
                      { label: "Version", value: `V${permit.version}` },
                    ]}
                  />
                  <Link
                    to="/operator/permits/$permitNumber"
                    params={{ permitNumber: permit.permitNumber }}
                    className="inline-flex w-full items-center justify-center rounded-lg bg-accent px-4 py-2 text-[13px] font-bold text-accent-foreground transition-colors hover:bg-accent-pressed"
                  >
                    Open permit
                  </Link>
                </div>
              </SectionCard>
            ) : null}
          </div>
        </div>
      </div>
    </PortalPage>
  );
}
