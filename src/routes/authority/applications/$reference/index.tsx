import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, ClipboardCheck, Info, RotateCcw, ThumbsUp } from "lucide-react";
import {
  ApplicationStatusBadge,
  Checklist,
  Drawer,
  EmptyState,
  SectionCard,
} from "@/components/desktop";
import { ApplicationSections } from "@/components/authority/ApplicationSections";
import { Button } from "@/components/ui/button";
import { useAppStore, useApplication } from "@/store";

export const Route = createFileRoute("/authority/applications/$reference/")({
  component: ReviewerWorkspace,
});

const REVIEWER_CHECKS = [
  {
    id: "operator",
    label: "Operator Verified",
    detail: "Operator record active and in good standing.",
  },
  {
    id: "aoc",
    label: "AOC Valid",
    detail: "Air Operator Certificate valid for the operation window.",
  },
  {
    id: "aircraft",
    label: "Aircraft Verified",
    detail: "Airframe registration and certificates current.",
  },
  { id: "insurance", label: "Insurance Valid", detail: "Insurance covers the flight category." },
  {
    id: "documents",
    label: "Documents Valid",
    detail: "All required documents attached and valid.",
  },
  { id: "route", label: "Route Complete", detail: "Origin, destination and routing supplied." },
  { id: "schedule", label: "Schedule Complete", detail: "Departure and arrival windows supplied." },
] as const;

function ReviewerWorkspace() {
  const { reference } = Route.useParams();
  const application = useApplication(reference);
  const recommendApproval = useAppStore((s) => s.recommendApproval);
  const requestInformation = useAppStore((s) => s.requestInformation);
  const returnApplication = useAppStore((s) => s.returnApplication);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!application) {
    return (
      <EmptyState
        title="Application not found"
        description={`No application matches ${reference}.`}
      />
    );
  }

  const canReview = application.status === "SUBMITTED" || application.status === "UNDER REVIEW";

  const itemizedChecks = REVIEWER_CHECKS.map((check) => ({
    id: check.id,
    label: check.label,
    detail: check.detail,
    outcome: "PASS" as const,
  }));

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <ApplicationSections application={application} />

        <div className="space-y-5">
          <SectionCard
            title="Reviewer Checklist"
            description="Desktop verification performed on submission."
          >
            <Checklist items={itemizedChecks} />
          </SectionCard>

          <SectionCard
            title="Review Actions"
            description="Decide the next step for this application."
          >
            {canReview ? (
              <div className="space-y-3">
                <Button className="w-full" onClick={() => setConfirmOpen(true)}>
                  <ThumbsUp size={15} /> Recommend Approval
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => requestInformation(application.id)}
                >
                  <Info size={15} /> Request Information
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-status-rejected"
                  onClick={() => returnApplication(application.id)}
                >
                  <RotateCcw size={15} /> Return Application
                </Button>
                <p className="text-[11px] text-text-subtle">
                  Recommending forwards the application to the finance desk for clearance.
                </p>
              </div>
            ) : application.status === "TECHNICAL REVIEW" ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-lg border border-border-soft bg-info-soft/40 px-3.5 py-3">
                  <ClipboardCheck size={18} className="mt-0.5 shrink-0 text-accent" />
                  <p className="text-[12.5px] text-text-muted">
                    This application has cleared finance and is ready for technical review.
                  </p>
                </div>
                <Link
                  to="/authority/applications/$reference/technical"
                  params={{ reference: application.reference }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-accent-foreground transition-colors hover:bg-accent-pressed"
                >
                  <ClipboardCheck size={15} /> Open Technical Review
                </Link>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-lg border border-border-soft bg-surface-muted px-3.5 py-3">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-status-cleared" />
                <div>
                  <div className="flex items-center gap-2">
                    <ApplicationStatusBadge status={application.status} />
                  </div>
                  <p className="mt-1.5 text-[12.5px] text-text-muted">
                    No reviewer action is required at this stage. The application is with another
                    desk in the workflow.
                  </p>
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      <Drawer
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Recommend approval"
        description={`Forward ${application.reference} to finance for clearance.`}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                recommendApproval(application.id);
                setConfirmOpen(false);
              }}
            >
              <ArrowRight size={15} /> Confirm recommendation
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-[13px] text-text-muted">
            The reviewer confirms that the operator, aircraft, documents, route and schedule have
            all been verified. Confirming will move this application to{" "}
            <strong>AWAITING FINANCE</strong>.
          </p>
          <Checklist
            items={itemizedChecks.map((check) => ({
              id: check.id,
              label: check.label,
              outcome: check.outcome,
            }))}
          />
        </div>
      </Drawer>
    </div>
  );
}
