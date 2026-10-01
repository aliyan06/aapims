import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, FileWarning, PencilLine, RefreshCw } from "lucide-react";
import {
  ApplicationStatusBadge,
  DescriptionList,
  EmptyState,
  PortalPage,
  SectionCard,
} from "@/components/desktop";
import { Button } from "@/components/ui/button";
import { DigitalPermit } from "@/components/permit/DigitalPermit";
import { formatDateTime, useApplication, useAppStore, usePermit, useRevisions } from "@/store";

export const Route = createFileRoute("/operator/permits/$permitNumber")({
  component: PermitDetail,
});

function PermitDetail() {
  const { permitNumber } = Route.useParams();
  const navigate = useNavigate();
  const permit = usePermit(permitNumber);
  const application = useApplication(permit?.applicationReference ?? "");
  const revisions = useRevisions();
  const pushToast = useAppStore((s) => s.pushToast);

  if (!permit) {
    return (
      <PortalPage
        title="Permit not found"
        breadcrumb={[{ label: "Permits", to: "/operator/permits" }]}
      >
        <EmptyState
          icon={FileWarning}
          title="Unknown permit number"
          description={`No permit matches ${permitNumber}.`}
          action={
            <Button onClick={() => navigate({ to: "/operator/permits" })}>Back to permits</Button>
          }
        />
      </PortalPage>
    );
  }

  const permitRevisions = revisions.filter((revision) => revision.permitId === permit.id);
  const isRevisionRequested = application?.status === "REVISION REQUESTED";
  const isReissued = permit.status === "REISSUED" || permit.version > 1;

  return (
    <PortalPage
      title={permit.permitNumber}
      description={`${permit.authorization} permit · ${permit.routeLabel}`}
      breadcrumb={[{ label: "Permits", to: "/operator/permits" }, { label: permit.permitNumber }]}
      actions={
        <Button
          variant="outline"
          onClick={() =>
            navigate({
              to: "/operator/revision/$permitNumber",
              params: { permitNumber: permit.permitNumber },
            })
          }
        >
          <PencilLine size={15} /> Request Revision
        </Button>
      }
    >
      <div className="space-y-5">
        {isRevisionRequested ? (
          <div className="flex items-start gap-3 rounded-xl border border-status-revision/30 bg-status-revision-soft px-4 py-3">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-status-revision" />
            <div>
              <p className="text-[13px] font-bold text-text-dark">Revision requested</p>
              <p className="text-[12px] text-text-muted">
                A revision is pending authority approval. The permit below remains valid until the
                revision is decided.
              </p>
            </div>
          </div>
        ) : null}

        {isReissued ? (
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

          <SectionCard
            title="Revisions"
            description={
              permitRevisions.length > 0
                ? "History of revision requests on this permit."
                : undefined
            }
          >
            {permitRevisions.length === 0 ? (
              <p className="text-[13px] text-text-muted">
                No revisions have been requested. Use{" "}
                <span className="font-semibold">Request Revision</span> to amend schedule, route,
                aircraft or documents.
              </p>
            ) : (
              <ul className="space-y-2">
                {permitRevisions.map((revision) => (
                  <li key={revision.id} className="rounded-lg border border-border-soft px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-bold text-text-dark">{revision.type}</span>
                      <span className="rounded-full bg-status-revision-soft px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-status-revision">
                        {revision.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-text-muted">
                      {revision.originalValue} →{" "}
                      <span className="font-semibold text-text-dark">{revision.newValue}</span>
                    </p>
                    <p className="mt-0.5 text-[12px] text-text-subtle">
                      {revision.reason} · {formatDateTime(revision.submittedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </PortalPage>
  );
}
