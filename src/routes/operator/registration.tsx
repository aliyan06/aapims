import { createFileRoute } from "@tanstack/react-router";
import { FileCheck2, Send, ShieldCheck } from "lucide-react";
import {
  DescriptionList,
  DocumentStatusBadge,
  PortalPage,
  SectionCard,
  StatusBadge,
  Timeline,
  type TimelineStep,
} from "@/components/desktop";
import { Button } from "@/components/ui/button";
import type { OperatorRecord } from "@/data/types";
import { formatDate, useAppStore, useDocuments, useOperator, usePermission } from "@/store";
import type { StatusTone } from "@/lib/status";

export const Route = createFileRoute("/operator/registration")({
  component: RegistrationScreen,
});

const KYC_SEQUENCE: readonly OperatorRecord["kycStatus"][] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER REVIEW",
  "APPROVED",
  "ACTIVE",
];

const KYC_DESCRIPTION: Record<OperatorRecord["kycStatus"], string> = {
  DRAFT: "Registration details captured but not yet submitted.",
  SUBMITTED: "Submitted to the authority for initial screening.",
  "UNDER REVIEW": "Documents and identity checks under review.",
  APPROVED: "Registration approved; awaiting activation.",
  ACTIVE: "Operator account is active and may apply for permits.",
};

const KYC_TONE: Record<OperatorRecord["kycStatus"], StatusTone> = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  "UNDER REVIEW": "review",
  APPROVED: "approved",
  ACTIVE: "issued",
};

const STATUS_TONE: Record<OperatorRecord["status"], StatusTone> = {
  VERIFIED: "approved",
  PENDING: "awaiting",
  SUSPENDED: "rejected",
};

function RegistrationScreen() {
  const operator = useOperator();
  const documents = useDocuments();
  const canManage = usePermission("org.profile.manage");
  const submitRegistration = useAppStore((s) => s.submitRegistration);

  const isDraft = operator.kycStatus === "DRAFT";
  const isActive = operator.kycStatus === "ACTIVE";

  const currentIndex = KYC_SEQUENCE.indexOf(operator.kycStatus);
  const steps: TimelineStep[] = KYC_SEQUENCE.map((status, index) => ({
    label: status,
    state: index < currentIndex ? "done" : index === currentIndex ? "current" : "pending",
    note: KYC_DESCRIPTION[status],
    by: index <= currentIndex ? operator.company : undefined,
  }));

  const supporting = documents.filter(
    (document) => document.ownerType === "operator" && document.ownerId === operator.id,
  );

  return (
    <PortalPage
      title="Registration & KYC"
      description="Track your operator registration, identity verification and supporting certifications."
      breadcrumb={[{ label: "Operator" }, { label: "Registration" }]}
    >
      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-5">
          <SectionCard
            title="Verification progress"
            description="Your registration moves through the following stages."
            className="lg:col-span-3"
          >
            <Timeline steps={steps} />
          </SectionCard>

          <SectionCard title="Current standing" className="lg:col-span-2">
            <div className="space-y-4">
              <div className="rounded-xl border border-border-soft bg-surface-muted/40 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-text-subtle">
                  KYC status
                </div>
                <div className="mt-1.5">
                  <StatusBadge label={operator.kycStatus} tone={KYC_TONE[operator.kycStatus]} />
                </div>
              </div>
              <div className="rounded-xl border border-border-soft bg-surface-muted/40 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-text-subtle">
                  Operator status
                </div>
                <div className="mt-1.5">
                  <StatusBadge label={operator.status} tone={STATUS_TONE[operator.status]} />
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full"
                  disabled={!canManage || !isDraft}
                  onClick={() => submitRegistration()}
                >
                  <Send size={15} /> Submit for verification
                </Button>
                <p className="text-[11px] leading-snug text-text-subtle">
                  {isActive
                    ? "Registration approved — this operator account is active."
                    : operator.kycStatus === "DRAFT"
                      ? "Submit your registration to the authority to begin KYC verification."
                      : "Registration is already with the authority for verification."}
                </p>
                {!canManage ? (
                  <p className="text-[11px] leading-snug text-text-subtle">
                    Your role has read-only access to operator registration.
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-status-approved/25 bg-status-approved-soft/40 px-3.5 py-2.5">
                <ShieldCheck size={16} className="text-status-approved" />
                <p className="text-[12px] font-semibold text-text-dark">
                  Registration held by the authority.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Company & operator details">
          <DescriptionList
            columns={3}
            items={[
              { label: "Company name", value: operator.company },
              { label: "Operator ID", value: operator.operatorId },
              { label: "Country", value: operator.country },
              { label: "AOC number", value: operator.aocNumber },
              { label: "AOC valid until", value: formatDate(operator.aocValidUntil) },
              { label: "Contact", value: `${operator.contactName} · ${operator.contactEmail}` },
            ]}
          />
        </SectionCard>

        <SectionCard
          title="Supporting certifications"
          description="Operator-level documents submitted as part of registration."
          padded={false}
        >
          <div className="divide-y divide-border-soft">
            {supporting.map((document) => (
              <div
                key={document.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted text-text-muted">
                    <FileCheck2 size={15} />
                  </span>
                  <div>
                    <div className="text-[13px] font-semibold text-text-dark">{document.name}</div>
                    <div className="text-[11px] text-text-subtle">
                      {document.category} · {document.reference}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-[12px] text-text-muted">
                    Expires {formatDate(document.expiry)}
                  </span>
                  <DocumentStatusBadge status={document.status} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </PortalPage>
  );
}
