import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, FileWarning, History, RefreshCw, XCircle } from "lucide-react";
import {
  ApplicationStatusBadge,
  DescriptionList,
  EmptyState,
  PortalPage,
  SectionCard,
  StatusBadge,
} from "@/components/desktop";
import { Button } from "@/components/ui/button";
import { DigitalPermit } from "@/components/permit/DigitalPermit";
import type { RevisionStatus } from "@/data/types";
import type { StatusTone } from "@/lib/status";
import { formatDateTime, useApplication, useAppStore, usePermit, useRevisions } from "@/store";

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
        />

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
                      {revision.status === "PENDING" ? (
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
