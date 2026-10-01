import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ClipboardCheck, RotateCcw, ShieldCheck } from "lucide-react";
import {
  ApplicationStatusBadge,
  Checklist,
  DescriptionList,
  EmptyState,
  SectionCard,
} from "@/components/desktop";
import { Button } from "@/components/ui/button";
import { operatorName } from "@/data";
import { formatDateTime, useAircraftItem, useAppStore, useApplication, useWorld } from "@/store";

export const Route = createFileRoute("/authority/applications/$reference/technical")({
  component: TechnicalReview,
});

const TECHNICAL_CHECKS = [
  {
    id: "route",
    label: "Route information complete",
    detail: "Origin, destination and routing are valid.",
  },
  {
    id: "entry",
    label: "Entry Point valid",
    detail: "Entry point falls within controlled airspace.",
  },
  { id: "exit", label: "Exit Point valid", detail: "Exit point falls within controlled airspace." },
  {
    id: "aircraft",
    label: "Aircraft valid",
    detail: "Airframe type and MTOW suitable for the route.",
  },
  {
    id: "schedule",
    label: "Schedule valid",
    detail: "Departure and arrival fit the requested slot.",
  },
  {
    id: "conflict",
    label: "No conflict detected",
    detail: "No overlapping clearance on the route.",
  },
] as const;

function TechnicalReview() {
  const { reference } = Route.useParams();
  const world = useWorld();
  const application = useApplication(reference);
  const aircraft = useAircraftItem(application?.aircraftId ?? "");
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

  return (
    <div className="space-y-5">
      {!isAtTechnicalReview ? (
        <div className="flex items-start gap-3 rounded-xl border border-status-awaiting/30 bg-status-awaiting-soft px-4 py-3">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-status-awaiting" />
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-bold text-text-dark">Not at the technical stage</p>
              <ApplicationStatusBadge status={application.status} />
            </div>
            <p className="text-[12px] text-text-muted">
              Technical review can only be actioned once an application reaches TECHNICAL REVIEW,
              after financial clearance.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <SectionCard
            title="Technical Detail"
            description="Airframe, routing and schedule on record."
          >
            <DescriptionList
              columns={3}
              items={[
                { label: "Operator", value: operatorName(world, application.operatorId) },
                { label: "Aircraft", value: aircraft?.registration ?? "—" },
                { label: "Type", value: aircraft?.type ?? "—" },
                {
                  label: "MTOW",
                  value: aircraft ? `${aircraft.mtowKg.toLocaleString()} kg` : "—",
                },
                { label: "Authorization", value: application.authorization },
                { label: "Category", value: application.category },
                {
                  label: "Route",
                  value: `${application.route.origin} (${application.route.originIcao}) → ${application.route.destination} (${application.route.destinationIcao})`,
                  fullWidth: true,
                },
                { label: "Entry point", value: application.route.entryPoint },
                { label: "Exit point", value: application.route.exitPoint },
                { label: "Departure (UTC)", value: formatDateTime(application.route.departureAt) },
                { label: "Arrival (UTC)", value: formatDateTime(application.route.arrivalAt) },
              ]}
            />
          </SectionCard>

          <SectionCard
            title="Technical Checklist"
            description="Route and airframe checks performed by the reviewer."
            actions={<ClipboardCheck size={16} className="text-accent" />}
          >
            <Checklist
              items={TECHNICAL_CHECKS.map((check) => ({
                id: check.id,
                label: check.label,
                detail: check.detail,
                outcome: "PASS" as const,
              }))}
            />
          </SectionCard>
        </div>

        <SectionCard
          title="Technical Decision"
          description="Record the outcome of the technical review."
        >
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
              Passing technical review forwards the application to the approver for final decision.
            </p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
