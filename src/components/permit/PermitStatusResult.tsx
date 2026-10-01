import { BadgeCheck, CalendarX, CircleX, ShieldX, type LucideIcon } from "lucide-react";
import type { PermitRecord } from "@/data/types";
import { getAircraft, operatorName } from "@/data/lookups";
import { formatDate, useWorld } from "@/store";
import { DescriptionList, type DescriptionItem } from "@/components/desktop";
import { QRVisual } from "./QRVisual";

export type PermitVerificationStatus = "VALID" | "INVALID" | "EXPIRED" | "REVOKED";

type PermitStatusConfig = {
  label: string;
  description: string;
  className: string;
  icon: LucideIcon;
};

const STATUS_CONFIG: Record<PermitVerificationStatus, PermitStatusConfig> = {
  VALID: {
    label: "VALID PERMIT",
    description: "This permit is authentic and falls within its validity window.",
    className: "border-status-cleared/30 bg-status-cleared-soft text-status-cleared",
    icon: BadgeCheck,
  },
  INVALID: {
    label: "INVALID",
    description: "No permit matches the supplied number or application reference.",
    className: "border-status-rejected/30 bg-status-rejected-soft text-status-rejected",
    icon: CircleX,
  },
  EXPIRED: {
    label: "EXPIRED",
    description: "This permit is genuine but its validity window has lapsed.",
    className: "border-border-strong bg-surface-muted text-text-muted",
    icon: CalendarX,
  },
  REVOKED: {
    label: "REVOKED",
    description: "This permit has been revoked by the authority and is no longer valid.",
    className: "border-status-rejected/30 bg-status-rejected-soft text-status-rejected",
    icon: ShieldX,
  },
};

type PermitStatusResultProps = {
  status: PermitVerificationStatus;
  permit?: PermitRecord;
  searchedTerm: string;
  className?: string;
};

/**
 * Public verification result card. Shows only non-sensitive permit data —
 * never fees, internal comments or documents.
 */
export function PermitStatusResult({
  status,
  permit,
  searchedTerm,
  className,
}: PermitStatusResultProps) {
  const world = useWorld();
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const aircraft = permit ? getAircraft(world, permit.aircraftId) : undefined;
  const operator = permit ? operatorName(world, permit.operatorId) : undefined;

  const items: DescriptionItem[] = [
    { label: "Permit Number", value: permit?.permitNumber ?? "—" },
    { label: "Reference Number", value: permit?.applicationReference ?? "—" },
    { label: "Issue Date", value: permit ? formatDate(permit.issuedAt) : "—" },
    { label: "Valid From", value: permit ? formatDate(permit.validFrom) : "—" },
    { label: "Valid Until", value: permit ? formatDate(permit.validUntil) : "—" },
    { label: "Operator", value: operator ?? "—" },
    { label: "Aircraft Registration", value: aircraft?.registration ?? "—" },
    { label: "Flight Number", value: permit?.flightNumber ?? "—" },
    { label: "Route", value: permit?.routeLabel ?? "—" },
    {
      label: "Permit Type",
      value: permit
        ? permit.authorization === "OVERFLIGHT"
          ? "Overflight Permit"
          : "Landing Permit"
        : "—",
    },
    { label: "Current Status", value: permit?.status ?? "Not found" },
    { label: "Verification Reference", value: permit?.verificationReference ?? "—" },
    {
      label: "Checksum Status",
      value: permit ? `${permit.checksum} · Verified` : "Not verified",
    },
  ];

  return (
    <div className={className}>
      <div className={`flex items-start gap-4 rounded-xl border px-5 py-4 ${config.className}`}>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface/70">
          <Icon size={24} />
        </span>
        <div className="min-w-0">
          <div className="text-[20px] font-black uppercase tracking-wide">{config.label}</div>
          <p className="mt-0.5 text-[13px] font-medium opacity-90">{config.description}</p>
          {searchedTerm ? (
            <p className="mt-1 text-[12px] font-semibold opacity-80">Searched: {searchedTerm}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-5 rounded-xl border border-border-soft bg-surface p-5 shadow-card lg:grid-cols-[1fr_180px]">
        <DescriptionList items={items} columns={2} />

        <div className="flex flex-col items-center justify-between gap-3 border-border-soft lg:border-l lg:pl-5">
          {permit ? (
            <>
              <QRVisual value={permit.permitNumber} className="h-32 w-32" />
              <div className="text-center text-[10px] font-semibold text-text-muted">
                Digitally issued through AAPIMS
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted text-text-subtle">
                <CircleX size={28} />
              </span>
              <p className="mt-2 text-[11px] font-semibold text-text-subtle">
                No verification record available
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
