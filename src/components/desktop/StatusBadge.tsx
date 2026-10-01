import {
  APPLICATION_STATUS_TONE,
  CLEARANCE_TONE,
  DOCUMENT_STATUS_TONE,
  PAYMENT_TONE,
  TONE_CLASS,
  TONE_DOT,
  VALIDATION_TONE,
  type StatusTone,
} from "@/lib/status";
import type {
  ApplicationStatus,
  DocumentStatus,
  FinancialClearance,
  PaymentStatus,
  ValidationOutcome,
} from "@/data/types";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  label: string;
  tone: StatusTone;
  className?: string;
  dot?: boolean;
};

export function StatusBadge({ label, tone, className, dot = true }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        TONE_CLASS[tone],
        className,
      )}
    >
      {dot ? <span className={cn("h-1.5 w-1.5 rounded-full", TONE_DOT[tone])} /> : null}
      {label}
    </span>
  );
}

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return <StatusBadge label={status} tone={APPLICATION_STATUS_TONE[status]} />;
}

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return <StatusBadge label={status} tone={DOCUMENT_STATUS_TONE[status]} />;
}

export function ValidationBadge({ outcome }: { outcome: ValidationOutcome }) {
  return <StatusBadge label={outcome} tone={VALIDATION_TONE[outcome]} />;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <StatusBadge label={status} tone={PAYMENT_TONE[status]} />;
}

export function ClearanceBadge({ status }: { status: FinancialClearance }) {
  return <StatusBadge label={status} tone={CLEARANCE_TONE[status]} />;
}
