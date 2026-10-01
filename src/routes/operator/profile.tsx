import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Building2, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { DescriptionList, PortalPage, SectionCard, StatusBadge } from "@/components/desktop";
import type { OperatorRecord } from "@/data/types";
import { formatDate, useOperator } from "@/store";
import type { StatusTone } from "@/lib/status";

export const Route = createFileRoute("/operator/profile")({
  component: ProfileScreen,
});

const STATUS_TONE: Record<OperatorRecord["status"], StatusTone> = {
  VERIFIED: "approved",
  PENDING: "awaiting",
  SUSPENDED: "rejected",
};

const KYC_TONE: Record<OperatorRecord["kycStatus"], StatusTone> = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  "UNDER REVIEW": "review",
  APPROVED: "approved",
  ACTIVE: "issued",
};

function ProfileScreen() {
  const operator = useOperator();

  return (
    <PortalPage
      title="Operator Profile"
      description="Your registered company details, operational approvals and verification status."
      breadcrumb={[{ label: "Operator" }, { label: "Profile" }]}
    >
      <div className="space-y-5">
        <SectionCard>
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-[17px] font-black text-white">
                {operator.company
                  .split(" ")
                  .map((part) => part.charAt(0))
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[18px] font-extrabold text-text-dark">{operator.company}</h2>
                  <StatusBadge label={operator.status} tone={STATUS_TONE[operator.status]} />
                </div>
                <p className="mt-0.5 text-[13px] text-text-muted">
                  Operator ID {operator.operatorId} · {operator.country}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-status-approved/30 bg-status-approved-soft/50 px-5 py-4">
              <span className="aa-stamp flex h-14 w-14 flex-col items-center justify-center rounded-full border-2 border-status-approved text-status-approved">
                <ShieldCheck size={20} />
                <span className="text-[8px] font-black uppercase tracking-wide">Verified</span>
              </span>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-status-approved">
                  Verification status
                </div>
                <div className="text-[13px] font-semibold text-text-dark">
                  {operator.status === "VERIFIED"
                    ? "Account and operator licence verified"
                    : "Verification in progress"}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-5 lg:grid-cols-2">
          <SectionCard
            title="Company & certificate details"
            description="Registration and licence records held by the authority."
          >
            <DescriptionList
              columns={2}
              items={[
                { label: "Company name", value: operator.company, fullWidth: true },
                { label: "Operator ID", value: operator.operatorId },
                { label: "Country of registration", value: operator.country },
                { label: "AOC number", value: operator.aocNumber },
                { label: "AOC valid until", value: formatDate(operator.aocValidUntil) },
                {
                  label: "Operator status",
                  value: (
                    <StatusBadge label={operator.status} tone={STATUS_TONE[operator.status]} />
                  ),
                },
                {
                  label: "KYC status",
                  value: (
                    <StatusBadge label={operator.kycStatus} tone={KYC_TONE[operator.kycStatus]} />
                  ),
                },
              ]}
            />
          </SectionCard>

          <SectionCard
            title="Primary contact"
            description="Authorised point of contact for permit correspondence."
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-info-soft text-accent">
                  <UserRound size={16} />
                </span>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-text-subtle">
                    Contact name
                  </div>
                  <div className="text-[13px] font-semibold text-text-dark">
                    {operator.contactName}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-info-soft text-accent">
                  <Mail size={16} />
                </span>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-text-subtle">
                    Email
                  </div>
                  <div className="text-[13px] font-semibold text-text-dark">
                    {operator.contactEmail}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-info-soft text-accent">
                  <Phone size={16} />
                </span>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-text-subtle">
                    Phone
                  </div>
                  <div className="text-[13px] font-semibold text-text-dark">
                    {operator.contactPhone}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-info-soft text-accent">
                  <Building2 size={16} />
                </span>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-text-subtle">
                    Registered operator
                  </div>
                  <div className="text-[13px] font-semibold text-text-dark">
                    {operator.operatorId}
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Authorisation summary"
          description="Key approvals on record for this operator."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border-soft bg-surface-muted/40 p-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-text-subtle">
                <BadgeCheck size={14} className="text-accent" /> Air Operator Certificate
              </div>
              <div className="mt-1.5 text-[14px] font-bold text-text-dark">
                {operator.aocNumber}
              </div>
              <div className="text-[12px] text-text-muted">
                Valid until {formatDate(operator.aocValidUntil)}
              </div>
            </div>
            <div className="rounded-xl border border-border-soft bg-surface-muted/40 p-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-text-subtle">
                <ShieldCheck size={14} className="text-accent" /> KYC / Registration
              </div>
              <div className="mt-1.5">
                <StatusBadge label={operator.kycStatus} tone={KYC_TONE[operator.kycStatus]} />
              </div>
            </div>
            <div className="rounded-xl border border-border-soft bg-surface-muted/40 p-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-text-subtle">
                <Building2 size={14} className="text-accent" /> Operator record
              </div>
              <div className="mt-1.5">
                <StatusBadge label={operator.status} tone={STATUS_TONE[operator.status]} />
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </PortalPage>
  );
}
