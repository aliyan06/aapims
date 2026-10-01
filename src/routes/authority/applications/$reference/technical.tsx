import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ClipboardCheck, Info, RotateCcw, ShieldCheck } from "lucide-react";
import {
  Checklist,
  DescriptionList,
  EmptyState,
  SectionCard,
  StatusBadge,
  Timeline,
  type ChecklistItem,
  type DescriptionItem,
  type TimelineStep,
} from "@/components/desktop";
import { Button } from "@/components/ui/button";
import { getAgent, getAircraft, operatorName } from "@/data";
import type {
  AircraftRecord,
  ApplicationRecord,
  DemoWorld,
  DocumentRecord,
  RouteDetails,
} from "@/data/types";
import { formatDateTime, useApplication, useAppStore, usePermission, useWorld } from "@/store";

import { RequirePermission } from "@/components/shell/RequirePermission";

export const Route = createFileRoute("/authority/applications/$reference/technical")({
  component: () => (
    <RequirePermission permission="tech.review">
      <TechnicalReview />
    </RequirePermission>
  ),
});

function outcomeFor(pass: boolean): ChecklistItem["outcome"] {
  return pass ? "PASS" : "BLOCKER";
}

/** All technical checks are derived from the shared world, never hardcoded. */
function buildTechnicalChecks(
  application: ApplicationRecord,
  world: DemoWorld,
  aircraft: AircraftRecord,
): ChecklistItem[] {
  const route = application.route;

  const routeComplete = Boolean(
    route.origin && route.destination && route.originIcao && route.destinationIcao,
  );
  const entryValid = Boolean(route.entryPoint && route.estimatedEntryAt);
  const exitValid = Boolean(route.exitPoint && route.estimatedExitAt);
  const aircraftValid = aircraft.mtowKg > 0;
  const scheduleValid =
    new Date(route.departureAt) < new Date(route.arrivalAt) &&
    new Date(route.estimatedEntryAt ?? route.departureAt) <=
      new Date(route.estimatedExitAt ?? route.arrivalAt);

  const overlapping = world.applications.find(
    (other) =>
      other.id !== application.id &&
      other.aircraftId === application.aircraftId &&
      other.route.departureAt === route.departureAt &&
      (other.status === "TECHNICAL REVIEW" ||
        other.status === "AWAITING FINAL APPROVAL" ||
        other.status === "APPROVED" ||
        other.status === "ISSUED"),
  );

  const duplicate = world.applications.find(
    (other) =>
      other.id !== application.id &&
      other.operatorId === application.operatorId &&
      other.aircraftId === application.aircraftId &&
      other.route.departureAt === route.departureAt,
  );

  const documents = application.documentIds
    .map((id) => world.documents.find((doc) => doc.id === id))
    .filter((doc): doc is DocumentRecord => Boolean(doc));
  const documentsValid = documents.length > 0 && documents.every((doc) => doc.status === "VALID");

  const operatorValid = operatorName(world, application.operatorId).trim().length > 0;
  const restrictedClear = Boolean(route.entryPoint && route.exitPoint);

  return [
    {
      id: "route",
      label: "Route information complete",
      detail: routeComplete
        ? "Origin, destination and routing are valid."
        : "Origin, destination or routing detail is missing.",
      outcome: outcomeFor(routeComplete),
    },
    {
      id: "entry",
      label: "Entry Point valid",
      detail: entryValid
        ? "Entry point falls within controlled airspace."
        : "Entry point or estimated entry time is missing.",
      outcome: outcomeFor(entryValid),
    },
    {
      id: "exit",
      label: "Exit Point valid",
      detail: exitValid
        ? "Exit point falls within controlled airspace."
        : "Exit point or estimated exit time is missing.",
      outcome: outcomeFor(exitValid),
    },
    {
      id: "aircraft",
      label: "Aircraft valid",
      detail: aircraftValid
        ? "Airframe type and MTOW suitable for the route."
        : "Aircraft MTOW is not on record.",
      outcome: outcomeFor(aircraftValid),
    },
    {
      id: "schedule",
      label: "Schedule valid",
      detail: scheduleValid
        ? "Departure, entry, exit and arrival times are consistent."
        : "Schedule times are inconsistent.",
      outcome: outcomeFor(scheduleValid),
    },
    {
      id: "operator",
      label: "Operator review",
      detail: operatorValid
        ? `${operatorName(world, application.operatorId)} is cleared to apply.`
        : "Operator could not be resolved.",
      outcome: outcomeFor(operatorValid),
    },
    {
      id: "documents",
      label: "Document validity check",
      detail: documentsValid
        ? "All attached documents are valid at the time of travel."
        : "One or more attached documents are missing, expired or unverified.",
      outcome: outcomeFor(documentsValid),
    },
    {
      id: "conflict",
      label: "Conflict check",
      detail: overlapping
        ? `Overlaps clearance on ${overlapping.reference}.`
        : "No overlapping clearance on the route or requested slot.",
      outcome: outcomeFor(!overlapping),
    },
    {
      id: "restricted",
      label: "Restricted-zone check",
      detail: restrictedClear
        ? "Route is clear of restricted airspace."
        : "Entry or exit point could not be cleared against restricted airspace.",
      outcome: outcomeFor(restrictedClear),
    },
    {
      id: "duplicate",
      label: "Duplicate-request check",
      detail: duplicate
        ? `A matching request already exists (${duplicate.reference}).`
        : "No duplicate application for this operator, aircraft and slot.",
      outcome: outcomeFor(!duplicate),
    },
  ];
}

function buildHistorySteps(application: ApplicationRecord): TimelineStep[] {
  const history = application.history;
  if (history.length === 0) {
    return [
      {
        label: application.status,
        state: "current",
        timestamp: formatDateTime(application.createdAt),
      },
    ];
  }
  return history.map((entry, index) => ({
    label: entry.status,
    state: index === history.length - 1 ? "current" : "done",
    timestamp: formatDateTime(entry.at),
    by: entry.by,
    note: entry.note,
  }));
}

type RouteStripProps = { route: RouteDetails };

/**
 * Stylised, integration-ready airspace route strip. This is an illustration of
 * the corridor on record, not a live GIS or airspace feed.
 */
function AirspaceRouteStrip({ route }: RouteStripProps) {
  const nodes = [
    { key: "origin", role: "Origin", code: route.originIcao, place: route.origin, filled: true },
    {
      key: "entry",
      role: "Entry",
      code: route.entryPoint,
      place: "Controlled airspace entry",
      filled: false,
    },
    {
      key: "exit",
      role: "Exit",
      code: route.exitPoint,
      place: "Controlled airspace exit",
      filled: false,
    },
    {
      key: "destination",
      role: "Destination",
      code: route.destinationIcao,
      place: route.destination,
      filled: true,
    },
  ];

  return (
    <div className="rounded-xl border border-border-soft bg-surface-muted px-5 py-4">
      <div className="relative">
        <svg
          viewBox="0 0 800 34"
          preserveAspectRatio="none"
          className="h-9 w-full"
          fill="none"
          aria-hidden
        >
          <path
            d="M100 17 H700"
            className="aa-route-dash stroke-accent/50"
            strokeWidth="2"
            strokeDasharray="8 10"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 grid grid-cols-4">
          {nodes.map((node) => (
            <span key={node.key} className="flex items-center justify-center">
              <span
                className={
                  node.filled
                    ? "h-3.5 w-3.5 rounded-full border-2 border-accent bg-accent"
                    : "h-3 w-3 rotate-45 border-2 border-accent bg-surface"
                }
              />
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {nodes.map((node) => (
          <div key={node.key} className="flex flex-col items-center text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-text-subtle">
              {node.role}
            </span>
            <span className="mt-0.5 text-[13px] font-bold text-text-dark">{node.code}</span>
            <span className="mt-0.5 text-[11px] leading-tight text-text-muted">{node.place}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5 border-t border-border-soft pt-2.5 text-[11px] text-text-subtle">
        <Info size={13} />
        Integration-ready — not a live airspace feed.
      </div>
    </div>
  );
}

function TechnicalReview() {
  const { reference } = Route.useParams();
  const world = useWorld();
  const application = useApplication(reference);
  const canReview = usePermission("tech.review");
  const passTechnicalReview = useAppStore((s) => s.passTechnicalReview);
  const returnApplication = useAppStore((s) => s.returnApplication);

  if (!application) {
    return (
      <EmptyState
        title="Application not found"
        description={`No application matches ${reference}.`}
      />
    );
  }

  const isAtTechnicalReview = application.status === "TECHNICAL REVIEW";
  const aircraft = getAircraft(world, application.aircraftId);
  const agent = getAgent(world, application.agentId);
  const checks = buildTechnicalChecks(application, world, aircraft);
  const historySteps = buildHistorySteps(application);

  const routeItems: DescriptionItem[] = [
    {
      label: "Route",
      value: `${application.route.origin} (${application.route.originIcao}) → ${application.route.destination} (${application.route.destinationIcao})`,
      fullWidth: true,
    },
    { label: "Entry point", value: application.route.entryPoint },
    { label: "Exit point", value: application.route.exitPoint },
    { label: "Timezone", value: application.route.timezone },
    { label: "Departure (UTC)", value: formatDateTime(application.route.departureAt) },
    { label: "Arrival (UTC)", value: formatDateTime(application.route.arrivalAt) },
    {
      label: "Estimated entry",
      value: application.route.estimatedEntryAt
        ? formatDateTime(application.route.estimatedEntryAt)
        : "—",
    },
    {
      label: "Estimated exit",
      value: application.route.estimatedExitAt
        ? formatDateTime(application.route.estimatedExitAt)
        : "—",
    },
  ];

  if (application.authorization === "LANDING") {
    routeItems.push(
      { label: "Departure slot", value: application.route.departureSlot ?? "—" },
      { label: "Arrival slot", value: application.route.arrivalSlot ?? "—" },
      { label: "Ground handling agent", value: application.route.groundHandlingAgent ?? "—" },
      { label: "Purpose of visit", value: application.route.purposeOfVisit ?? "—" },
    );
  }

  return (
    <div className="space-y-5">
      {!isAtTechnicalReview ? (
        <div className="flex items-start gap-3 rounded-xl border border-status-awaiting/30 bg-status-awaiting-soft px-4 py-3">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-status-awaiting" />
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-bold text-text-dark">Not at the technical stage</p>
            </div>
            <p className="text-[12px] text-text-muted">
              Technical review can only be actioned once an application reaches TECHNICAL REVIEW,
              after financial clearance. Current stage: {application.status}.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <SectionCard
            title="Airspace route"
            description="Route corridor, entry and exit points on record."
          >
            <AirspaceRouteStrip route={application.route} />
          </SectionCard>

          <SectionCard
            title="Aircraft & operator"
            description="Airframe, operator and agent on record."
            actions={<StatusBadge label={application.authorization} tone="review" dot={false} />}
          >
            <DescriptionList
              columns={3}
              items={[
                { label: "Operator", value: operatorName(world, application.operatorId) },
                { label: "Agent", value: agent?.name ?? "Direct submission" },
                { label: "Agent reference", value: agent?.agentId ?? "—" },
                { label: "Aircraft", value: aircraft.registration },
                { label: "Type", value: aircraft.type },
                { label: "MTOW", value: `${aircraft.mtowKg.toLocaleString()} kg` },
                {
                  label: "Flight",
                  value: `${application.flight.flightNumber} / ${application.flight.callSign}`,
                },
                { label: "Category", value: application.category },
                { label: "Authorization", value: application.authorization },
              ]}
            />
          </SectionCard>

          <SectionCard
            title="Route, entry, exit & schedule"
            description="Times are shown in UTC as filed."
          >
            <DescriptionList columns={3} items={routeItems} />
          </SectionCard>

          <SectionCard
            title="Technical Checklist"
            description="Route, airframe and airspace checks performed by the reviewer."
            actions={<ClipboardCheck size={16} className="text-accent" />}
          >
            <Checklist items={checks} />
          </SectionCard>
        </div>

        <div className="space-y-5">
          <SectionCard
            title="Technical Decision"
            description="Record the outcome of the technical review."
          >
            {canReview ? (
              <div className="space-y-3">
                <Button
                  className="w-full"
                  disabled={!isAtTechnicalReview}
                  onClick={() => passTechnicalReview(application.id)}
                >
                  <ShieldCheck size={15} /> Pass Technical Review
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-status-rejected"
                  disabled={!isAtTechnicalReview}
                  onClick={() => returnApplication(application.id)}
                >
                  <RotateCcw size={15} /> Return for Correction
                </Button>
                <p className="text-[11px] text-text-subtle">
                  Passing technical review forwards the application to the approver for final
                  decision.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 rounded-lg border border-border-soft bg-surface-muted px-3.5 py-3">
                <Info size={16} className="mt-0.5 shrink-0 text-text-subtle" />
                <p className="text-[12px] text-text-muted">
                  Your role can view the technical checks read-only. Sign in as the Permit Reviewer
                  to pass or return this application.
                </p>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Review history"
            description="Status history recorded for this application."
          >
            <Timeline steps={historySteps} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
