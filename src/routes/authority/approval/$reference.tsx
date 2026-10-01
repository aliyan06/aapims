import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileWarning,
  Info,
  RotateCcw,
  Stamp,
  XCircle,
} from "lucide-react";
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
  type TimelineStep,
} from "@/components/desktop";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { STORY_IDS, type ApplicationRecord, type ApplicationStatus } from "@/data/types";
import { getAircraft, operatorName } from "@/data/lookups";
import {
  formatDate,
  formatDateTime,
  useApplication,
  useAppStore,
  useDocuments,
  usePermit,
  useWorld,
} from "@/store";

export const Route = createFileRoute("/authority/approval/$reference")({
  component: ApprovalDetail,
});

const DEFAULT_REJECT_REASON = "Does not meet regulatory requirements";

const APPROVAL_RANK: Partial<Record<ApplicationStatus, number>> = {
  DRAFT: 0,
  SUBMITTED: 1,
  "UNDER REVIEW": 2,
  "AWAITING FINANCE": 3,
  "TECHNICAL REVIEW": 4,
  "AWAITING FINAL APPROVAL": 5,
  APPROVED: 6,
  ISSUED: 7,
  REISSUED: 7,
  "REVISION REQUESTED": 7,
};

type ApprovalStep = {
  label: string;
  rank: number;
  historyStatus: ApplicationStatus | null;
};

const APPROVAL_STEPS: ApprovalStep[] = [
  { label: "Submitted", rank: 1, historyStatus: "SUBMITTED" },
  { label: "Reviewed", rank: 2, historyStatus: "AWAITING FINANCE" },
  { label: "Finance Cleared", rank: 3, historyStatus: "TECHNICAL REVIEW" },
  { label: "Technical Review Passed", rank: 4, historyStatus: "AWAITING FINAL APPROVAL" },
  { label: "Awaiting Final Approval", rank: 5, historyStatus: null },
  { label: "Approved", rank: 6, historyStatus: "APPROVED" },
  { label: "Issued", rank: 7, historyStatus: "ISSUED" },
];

function buildApprovalTimeline(application: ApplicationRecord): TimelineStep[] {
  const rank = APPROVAL_RANK[application.status] ?? 0;
  return APPROVAL_STEPS.map((step) => {
    const history = step.historyStatus
      ? [...application.history].reverse().find((entry) => entry.status === step.historyStatus)
      : undefined;
    let state: TimelineStep["state"] = "pending";
    if (rank > step.rank) state = "done";
    else if (rank === step.rank) state = "current";
    return {
      label: step.label,
      state,
      timestamp: history ? formatDateTime(history.at) : undefined,
      by: history?.by,
      note: history?.note,
    };
  });
}

function ApprovalDetail() {
  const { reference } = Route.useParams();
  const navigate = useNavigate();
  const world = useWorld();
  const documents = useDocuments();
  const application = useApplication(reference);
  const permit = usePermit(application?.permitId ?? "");

  const approvePermit = useAppStore((s) => s.approvePermit);
  const rejectPermit = useAppStore((s) => s.rejectPermit);
  const issuePermit = useAppStore((s) => s.issuePermit);
  const requestInformation = useAppStore((s) => s.requestInformation);

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState(DEFAULT_REJECT_REASON);

  if (!application) {
    return (
      <PortalPage
        title="Application not found"
        breadcrumb={[{ label: "Approval", to: "/authority/approval" }]}
      >
        <EmptyState
          icon={FileWarning}
          title="Unknown application reference"
          description={`No application matches ${reference}.`}
          action={
            <Button onClick={() => navigate({ to: "/authority/approval" })}>
              Back to approval queue
            </Button>
          }
        />
      </PortalPage>
    );
  }

  const canApprove = application.status === "AWAITING FINAL APPROVAL";
  const canIssue = application.status === "APPROVED";
  const isFinalised = application.status === "ISSUED" || application.status === "REISSUED";
  const isRejected = application.status === "REJECTED";

  const aircraft = getAircraft(world, application.aircraftId);
  const applicationDocuments = documents.filter((document) =>
    application.documentIds.includes(document.id),
  );
  const total = application.finance.permitFee + application.finance.processingFee;

  function onConfirmApprove() {
    if (!application) return;
    approvePermit(application.id);
    setApproveOpen(false);
  }

  function onConfirmReject() {
    if (!application) return;
    rejectPermit(application.id, rejectReason.trim() || DEFAULT_REJECT_REASON);
    setRejectOpen(false);
    setRejectReason(DEFAULT_REJECT_REASON);
  }

  function onIssue() {
    if (!application) return;
    if (issuePermit(application.id)) {
      const issued = useAppStore
        .getState()
        .world.permits.find((item) => item.applicationReference === application.reference);
      const permitNumber = issued?.permitNumber ?? STORY_IDS.permitNumber;
      navigate({ to: "/authority/permits/$permitNumber", params: { permitNumber } });
    }
  }

  function onReturn() {
    if (!application) return;
    requestInformation(application.id);
  }

  return (
    <PortalPage
      title={application.reference}
      description={`${application.permitKind} · ${application.category}`}
      breadcrumb={[
        { label: "Approval", to: "/authority/approval" },
        { label: application.reference },
      ]}
      actions={<ApplicationStatusBadge status={application.status} />}
    >
      <div className="space-y-5">
        {isRejected ? (
          <div className="flex items-start gap-3 rounded-xl border border-status-rejected/30 bg-status-rejected-soft px-4 py-3">
            <XCircle size={20} className="mt-0.5 shrink-0 text-status-rejected" />
            <div>
              <p className="text-[13px] font-bold text-text-dark">Application rejected</p>
              <p className="text-[12px] text-text-muted">
                This application was rejected. No permit will be issued.
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
                  { label: "Assigned reviewer", value: application.assignedReviewer },
                  {
                    label: "Authorization",
                    value: `${application.authorization} · ${application.permitKind}`,
                  },
                ]}
              />
            </SectionCard>

            <SectionCard title="Aircraft" description="Airframe assigned to this application.">
              <DescriptionList
                columns={2}
                items={[
                  { label: "Registration", value: aircraft.registration },
                  { label: "Type", value: aircraft.type },
                  { label: "MTOW", value: `${aircraft.mtowKg.toLocaleString()} kg` },
                  {
                    label: "Airworthiness",
                    value: (
                      <DocumentStatusBadge status={aircraft.certificates.airworthiness.status} />
                    ),
                  },
                ]}
              />
            </SectionCard>

            <SectionCard title="Flight" description="Category and operational detail.">
              <DescriptionList
                columns={3}
                items={[
                  { label: "Flight number", value: application.flight.flightNumber },
                  { label: "Call sign", value: application.flight.callSign },
                  { label: "Passengers", value: application.flight.passengerCount },
                  { label: "Cargo", value: application.flight.cargo },
                  { label: "Purpose", value: application.flight.purpose },
                  { label: "Category", value: application.category },
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
                  {
                    label: "Departure (UTC)",
                    value: formatDateTime(application.route.departureAt),
                  },
                  { label: "Arrival (UTC)", value: formatDateTime(application.route.arrivalAt) },
                ]}
              />
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
                    value: `${application.finance.currency} ${total.toLocaleString()}`,
                  },
                  {
                    label: "Payment method",
                    value: application.finance.paymentMethod ?? "Not selected",
                  },
                  {
                    label: "Paid at",
                    value: application.finance.paidAt
                      ? formatDateTime(application.finance.paidAt)
                      : "—",
                  },
                  { label: "Clearance", value: application.finance.financialClearance },
                ]}
              />
            </SectionCard>
          </div>

          <div className="space-y-5">
            <SectionCard title="Approval history" description="Position in the approval workflow.">
              <Timeline steps={buildApprovalTimeline(application)} />
            </SectionCard>

            <SectionCard title="Decision" description="Permit approver actions.">
              <div className="space-y-3">
                {canApprove ? (
                  <>
                    <div className="flex items-start gap-3 rounded-lg border border-status-awaiting/30 bg-warning-soft px-3.5 py-2.5">
                      <Stamp size={16} className="mt-0.5 shrink-0 text-status-awaiting" />
                      <p className="text-[12px] font-semibold text-text-dark">
                        Ready for the final decision. Approving clears this application for permit
                        issuance.
                      </p>
                    </div>
                    <Button className="w-full" onClick={() => setApproveOpen(true)}>
                      <CheckCircle2 size={15} />
                      Approve Permit
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setRejectOpen(true)}
                    >
                      <XCircle size={15} />
                      Reject Permit
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={onReturn}>
                      <RotateCcw size={15} />
                      Return to Reviewer
                    </Button>
                  </>
                ) : null}

                {canIssue ? (
                  <>
                    <div className="flex items-start gap-3 rounded-lg border border-status-approved/30 bg-status-approved-soft px-3.5 py-2.5">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-status-approved" />
                      <p className="text-[12px] font-semibold text-text-dark">
                        Permit approved. Issue the digital e-permit to make it verifiable.
                      </p>
                    </div>
                    <Button className="w-full" onClick={onIssue}>
                      <ArrowRight size={15} />
                      Issue Digital Permit
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={onReturn}>
                      <RotateCcw size={15} />
                      Return to Reviewer
                    </Button>
                  </>
                ) : null}

                {isFinalised ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 rounded-lg border border-status-issued/30 bg-status-issued-soft px-3.5 py-2.5">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-status-issued" />
                      <p className="text-[12px] font-semibold text-text-dark">
                        Digital permit issued{permit ? ` · ${permit.permitNumber}` : ""}.
                      </p>
                    </div>
                    {permit ? (
                      <Button
                        className="w-full"
                        onClick={() =>
                          navigate({
                            to: "/authority/permits/$permitNumber",
                            params: { permitNumber: permit.permitNumber },
                          })
                        }
                      >
                        <ArrowRight size={15} />
                        View Digital Permit
                      </Button>
                    ) : null}
                  </div>
                ) : null}

                {isRejected ? (
                  <div className="flex items-start gap-3 rounded-lg border border-status-rejected/30 bg-status-rejected-soft px-3.5 py-2.5">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-status-rejected" />
                    <p className="text-[12px] font-semibold text-text-dark">
                      This application was rejected. No further approval action is available.
                    </p>
                  </div>
                ) : null}

                {!canApprove && !canIssue && !isFinalised && !isRejected ? (
                  <div className="flex items-start gap-3 rounded-lg border border-border-soft bg-info-soft px-3.5 py-2.5">
                    <Info size={16} className="mt-0.5 shrink-0 text-accent" />
                    <p className="text-[12px] font-semibold text-text-dark">
                      No approval action is available at {application.status}. The application is
                      still progressing through the workflow.
                    </p>
                  </div>
                ) : null}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approve and Issue Permit?</DialogTitle>
            <DialogDescription>
              {application.reference} will be approved and cleared for digital permit issuance.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onConfirmApprove}>Approve Permit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject permit</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {application.reference}. The operator will be notified.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder={DEFAULT_REJECT_REASON}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirmReject}>
              Reject Permit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalPage>
  );
}
