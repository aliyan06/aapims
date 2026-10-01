import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, FileWarning, History, RefreshCw, XCircle } from "lucide-react";
import {
  ApplicationStatusBadge,
  Checklist,
  DescriptionList,
  EmptyState,
  PortalPage,
  SectionCard,
  StatusBadge,
  type ChecklistItem,
} from "@/components/desktop";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DigitalPermit } from "@/components/permit/DigitalPermit";
import type { RevisionStatus } from "@/data/types";
import type { StatusTone } from "@/lib/status";
import {
  formatDateTime,
  useApplication,
  useAppStore,
  usePermission,
  usePermit,
  useRevisions,
} from "@/store";

export const Route = createFileRoute("/authority/permits/$permitNumber")({
  component: AuthorityPermitDetail,
});

const REVISION_TONE: Record<RevisionStatus, StatusTone> = {
  PENDING: "awaiting",
  APPROVED: "cleared",
  REJECTED: "rejected",
};

function AuthorityPermitDetail() {
  const { permitNumber } = Route.useParams();
  const navigate = useNavigate();
  const permit = usePermit(permitNumber);
  const application = useApplication(permit?.applicationReference ?? "");
  const revisions = useRevisions();
  const pushToast = useAppStore((s) => s.pushToast);
  const approveRevision = useAppStore((s) => s.approveRevision);
  const rejectRevision = useAppStore((s) => s.rejectRevision);
  const revokePermit = useAppStore((s) => s.revokePermit);
  const expirePermit = useAppStore((s) => s.expirePermit);
  const canDecideRevisions = usePermission("permit.revise.approve");
  const canManageStatus = usePermission("permit.approve");
  const [revokeReason, setRevokeReason] = useState("");

  if (!permit) {
    return (
      <PortalPage
        title="Permit not found"
        breadcrumb={[{ label: "Permits", to: "/authority/permits" }]}
      >
        <EmptyState
          icon={FileWarning}
          title="Unknown permit number"
          description={`No permit matches ${permitNumber}.`}
          action={
            <Button onClick={() => navigate({ to: "/authority/permits" })}>Back to permits</Button>
          }
        />
      </PortalPage>
    );
  }

  const permitRevisions = revisions.filter((revision) => revision.permitId === permit.id);
  const hasPendingRevision = permitRevisions.some((revision) => revision.status === "PENDING");
  const showRevisionPanel =
    permitRevisions.length > 0 ||
    permit.status === "REISSUED" ||
    application?.status === "REVISION REQUESTED";
  const isReissued = permit.status === "REISSUED" || permit.version > 1;
  const revalidationOutcome = permit.version > 1 ? "PASS" : "WARNING";
  const revalidationItems: ChecklistItem[] = isReissued
    ? [
        {
          id: "documents",
          label: "Documents revalidated",
          detail: "Operational documents re-checked against the revised schedule.",
          outcome: revalidationOutcome,
        },
        {
          id: "insurance",
          label: "Insurance revalidated",
          detail: "Certificate of insurance remains valid for the revised period.",
          outcome: revalidationOutcome,
        },
        {
          id: "aoc",
          label: "AOC revalidated",
          detail: "Air Operator Certificate verified for the reissued permit.",
          outcome: revalidationOutcome,
        },
        {
          id: "technical",
          label: "Technical revalidation",
          detail: "Aircraft airworthiness and technical review confirmed.",
          outcome: revalidationOutcome,
        },
      ]
    : [];

  return (
    <PortalPage
      title={permit.permitNumber}
      description={`${permit.authorization} permit · ${permit.routeLabel}`}
      breadcrumb={[{ label: "Permits", to: "/authority/permits" }, { label: permit.permitNumber }]}
      actions={
        <div className="flex items-center gap-2">
          <StatusBadge
            label={permit.status}
            tone={
              permit.status === "REVOKED"
                ? "rejected"
                : permit.status === "EXPIRED"
                  ? "expired"
                  : "issued"
            }
          />
          {application ? <ApplicationStatusBadge status={application.status} /> : null}
        </div>
      }
    >
      <div className="space-y-5">
        {canManageStatus &&
        (permit.status === "ISSUED" ||
          permit.status === "ACTIVE" ||
          permit.status === "REISSUED") ? (
          <SectionCard
            title="Permit status"
            description="Revoke or expire this permit. Every status change is written to the audit trail."
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex-1">
                <span className="mb-1.5 block text-[12px] font-semibold text-text-dark">
                  Revocation reason
                </span>
                <Textarea
                  rows={2}
                  placeholder="Reason for revocation (recorded on the audit trail)"
                  value={revokeReason}
                  onChange={(event) => setRevokeReason(event.target.value)}
                />
              </label>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => expirePermit(permit.id)}>
                  Mark expired
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    revokePermit(permit.id, revokeReason);
                    setRevokeReason("");
                  }}
                >
                  Revoke permit
                </Button>
              </div>
            </div>
          </SectionCard>
        ) : null}

        {hasPendingRevision ? (
          <div className="flex items-start gap-3 rounded-xl border border-status-revision/30 bg-status-revision-soft px-4 py-3">
            <History size={20} className="mt-0.5 shrink-0 text-status-revision" />
            <div>
              <p className="text-[13px] font-bold text-text-dark">Revision pending decision</p>
              <p className="text-[12px] text-text-muted">
                The operator has requested a revision. Approve to reissue the permit at a new
                version, or reject to keep the current permit unchanged.
              </p>
            </div>
          </div>
        ) : null}

        {permit.status === "REISSUED" ? (
          <div className="flex items-center gap-3 rounded-xl border border-status-issued/30 bg-status-issued-soft px-4 py-3">
            <RefreshCw size={18} className="text-status-issued" />
            <p className="text-[13px] font-bold text-text-dark">
              Version {permit.version} · reissued permit supersedes the previous version.
            </p>
          </div>
        ) : null}

        <DigitalPermit
          permit={permit}
          onDownload={() =>
            pushToast({
              title: "Download started",
              description: `${permit.permitNumber} PDF is being prepared.`,
              tone: "info",
            })
          }
          onPrint={() =>
            pushToast({
              title: "Print queued",
              description: `${permit.permitNumber} sent to the print queue.`,
              tone: "info",
            })
          }
          onVerify={() =>
            navigate({
              to: "/verify",
              search: { permit: permit.permitNumber, reference: undefined },
            })
          }
          onEmail={() =>
            pushToast({
              title: "Permit emailed",
              description: "Permit emailed to the operator (demo).",
              tone: "info",
            })
          }
        />

        {isReissued ? (
          <SectionCard
            title="Revalidation checklist"
            description={`Version history V1 → V${permit.version} · superseded by the latest reissue.`}
          >
            <Checklist items={revalidationItems} />
          </SectionCard>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-2">
          <SectionCard
            title="Permit Record"
            description="Authoritative permit data held by the authority."
          >
            <DescriptionList
              columns={2}
              items={[
                { label: "Permit number", value: permit.permitNumber },
                { label: "Application", value: permit.applicationReference },
                { label: "Authorization", value: permit.authorization },
                { label: "Status", value: permit.status },
                { label: "Version", value: `V${permit.version}` },
                { label: "Signed by", value: permit.signedBy },
                { label: "Issued at", value: formatDateTime(permit.issuedAt) },
                { label: "Verification reference", value: permit.verificationReference },
                { label: "Checksum", value: permit.checksum },
                { label: "Valid from", value: permit.validFrom },
                { label: "Valid until", value: permit.validUntil },
                {
                  label: "Application status",
                  value: application ? <ApplicationStatusBadge status={application.status} /> : "—",
                },
              ]}
            />
          </SectionCard>

          {showRevisionPanel ? (
            <SectionCard
              title="Revision decisions"
              description="Decide revision requests submitted against this permit."
            >
              {permitRevisions.length === 0 ? (
                <p className="text-[13px] text-text-muted">
                  No revision requests have been recorded for this permit yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {permitRevisions.map((revision) => (
                    <li
                      key={revision.id}
                      className="rounded-lg border border-border-soft px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-bold text-text-dark">
                          {revision.type}
                        </span>
                        <StatusBadge
                          label={revision.status}
                          tone={REVISION_TONE[revision.status]}
                        />
                      </div>
                      <p className="mt-1 text-[12px] text-text-muted">
                        {revision.originalValue} →{" "}
                        <span className="font-semibold text-text-dark">{revision.newValue}</span>
                      </p>
                      <p className="mt-0.5 text-[12px] text-text-subtle">
                        {revision.reason} · {formatDateTime(revision.submittedAt)}
                      </p>
                      {revision.status === "PENDING" && canDecideRevisions ? (
                        <div className="mt-3 flex items-center gap-2">
                          <Button size="sm" onClick={() => approveRevision(revision.id)}>
                            <CheckCircle2 size={14} />
                            Approve Revision
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectRevision(revision.id)}
                          >
                            <XCircle size={14} />
                            Reject Revision
                          </Button>
                        </div>
                      ) : revision.status === "PENDING" ? (
                        <p className="mt-2 text-[11px] text-text-subtle">
                          Awaiting decision by an authorised approver.
                        </p>
                      ) : revision.decidedAt ? (
                        <p className="mt-2 text-[11px] text-text-subtle">
                          {revision.status} by {revision.decidedBy} ·{" "}
                          {formatDateTime(revision.decidedAt)}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          ) : null}
        </div>
      </div>
    </PortalPage>
  );
}
