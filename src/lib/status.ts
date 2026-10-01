import type {
  ApplicationStatus,
  DocumentStatus,
  FinancialClearance,
  PaymentStatus,
  ValidationOutcome,
} from "@/data/types";

export type StatusTone =
  | "draft"
  | "submitted"
  | "review"
  | "awaiting"
  | "cleared"
  | "approved"
  | "issued"
  | "revision"
  | "rejected"
  | "returned"
  | "expired";

/** Tailwind classes per tone. Uses design tokens only (no raw hex). */
export const TONE_CLASS: Record<StatusTone, string> = {
  draft: "bg-status-draft-soft text-status-draft border-status-draft/25",
  submitted: "bg-status-submitted-soft text-status-submitted border-status-submitted/25",
  review: "bg-status-review-soft text-status-review border-status-review/25",
  awaiting: "bg-status-awaiting-soft text-status-awaiting border-status-awaiting/25",
  cleared: "bg-status-cleared-soft text-status-cleared border-status-cleared/25",
  approved: "bg-status-approved-soft text-status-approved border-status-approved/25",
  issued: "bg-status-issued-soft text-status-issued border-status-issued/25",
  revision: "bg-status-revision-soft text-status-revision border-status-revision/25",
  rejected: "bg-status-rejected-soft text-status-rejected border-status-rejected/25",
  returned: "bg-status-returned-soft text-status-returned border-status-returned/25",
  expired: "bg-status-expired-soft text-status-expired border-status-expired/25",
};

export const TONE_DOT: Record<StatusTone, string> = {
  draft: "bg-status-draft",
  submitted: "bg-status-submitted",
  review: "bg-status-review",
  awaiting: "bg-status-awaiting",
  cleared: "bg-status-cleared",
  approved: "bg-status-approved",
  issued: "bg-status-issued",
  revision: "bg-status-revision",
  rejected: "bg-status-rejected",
  returned: "bg-status-returned",
  expired: "bg-status-expired",
};

export const APPLICATION_STATUS_TONE: Record<ApplicationStatus, StatusTone> = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  "UNDER REVIEW": "review",
  "AWAITING FINANCE": "awaiting",
  "TECHNICAL REVIEW": "review",
  "AWAITING FINAL APPROVAL": "awaiting",
  APPROVED: "approved",
  ISSUED: "issued",
  ACTIVE: "issued",
  "REVISION REQUESTED": "revision",
  REISSUED: "issued",
  REJECTED: "rejected",
  RETURNED: "returned",
  EXPIRED: "expired",
  REVOKED: "rejected",
  ARCHIVED: "draft",
};

export const DOCUMENT_STATUS_TONE: Record<DocumentStatus, StatusTone> = {
  VALID: "cleared",
  "EXPIRING SOON": "awaiting",
  EXPIRED: "expired",
  "PENDING VERIFICATION": "submitted",
  REJECTED: "rejected",
  MISSING: "rejected",
  "NOT REQUIRED": "draft",
};

export const VALIDATION_TONE: Record<ValidationOutcome, StatusTone> = {
  PASS: "cleared",
  WARNING: "awaiting",
  BLOCKER: "rejected",
};

export const PAYMENT_TONE: Record<PaymentStatus, StatusTone> = {
  UNPAID: "awaiting",
  PAID: "cleared",
  REFUNDED: "draft",
};

export const CLEARANCE_TONE: Record<FinancialClearance, StatusTone> = {
  "PENDING CLEARANCE": "awaiting",
  CLEARED: "cleared",
  "ON HOLD": "rejected",
};

/** Ordered permit lifecycle used by timeline components. */
export const LIFECYCLE_STEPS: readonly ApplicationStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER REVIEW",
  "AWAITING FINANCE",
  "TECHNICAL REVIEW",
  "AWAITING FINAL APPROVAL",
  "APPROVED",
  "ISSUED",
  "REVISION REQUESTED",
  "REISSUED",
];
