/**
 * AAPIMS domain types. All entities are fictional.
 * Ids are stable and prefixed so they read clearly in the demo:
 *   op-*  operator        ac-*  aircraft        ag-*  agent
 *   doc-* document        app-* application     prm-* permit
 *   rev-* revision        aud-* audit entry     ntf-* notification
 */

export type PermitAuthorization = "OVERFLIGHT" | "LANDING";

export type PermitKind = "SINGLE PERMIT" | "BLOCK PERMIT" | "SEASONAL PERMIT" | "OFFLINE PERMIT";

export type FlightCategory =
  | "Commercial Scheduled"
  | "Commercial Non-Scheduled / Ad-hoc"
  | "Private"
  | "Cargo"
  | "Military / Diplomatic"
  | "Humanitarian / Emergency"
  | "Search & Rescue"
  | "Air Ambulance / Medical Evacuation"
  | "Ferry / Test / Delivery";

export type ApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER REVIEW"
  | "AWAITING FINANCE"
  | "TECHNICAL REVIEW"
  | "AWAITING FINAL APPROVAL"
  | "APPROVED"
  | "ISSUED"
  | "REVISION REQUESTED"
  | "REISSUED"
  | "REJECTED"
  | "RETURNED"
  | "EXPIRED"
  | "REVOKED"
  | "ARCHIVED";

export type DocumentStatus =
  | "VALID"
  | "EXPIRING SOON"
  | "EXPIRED"
  | "PENDING VERIFICATION"
  | "REJECTED"
  | "MISSING"
  | "NOT REQUIRED";

export type DocumentCategory =
  | "Company"
  | "Operator"
  | "Aircraft"
  | "Insurance"
  | "Authorization"
  | "Flight-specific"
  | "Cargo"
  | "PAX"
  | "Special-purpose";

export type VerificationStatus = "VERIFIED" | "PENDING VERIFICATION" | "REJECTED";

export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED";
export type FinancialClearance = "PENDING CLEARANCE" | "CLEARED" | "ON HOLD";

export type ValidationOutcome = "PASS" | "WARNING" | "BLOCKER";

export type RevisionType =
  "Date / Time Change" | "Route Change" | "Aircraft Change" | "Document Update";

export type RevisionStatus = "PENDING" | "APPROVED" | "REJECTED";

/** Authority-side roles. */
export type AuthorityRole = "superadmin" | "reviewer" | "approver" | "finance";

/** Customer-side (operator) roles. */
export type CustomerRole = "operatorAdmin" | "permitOfficer" | "operatorFinance" | "viewer";

/** All login roles plus the unauthenticated public verification surface. */
export type Role = AuthorityRole | CustomerRole | "public";

/** Notifications are addressed to an audience, coarser than the granular role. */
export type NotificationAudience = "customer" | "reviewer" | "finance" | "approver" | "public";

export type OperatorRecord = {
  id: string;
  company: string;
  operatorId: string;
  country: string;
  aocNumber: string;
  aocValidUntil: string;
  status: "VERIFIED" | "PENDING" | "SUSPENDED";
  kycStatus: "DRAFT" | "SUBMITTED" | "UNDER REVIEW" | "APPROVED" | "ACTIVE";
  contactName: string;
  contactEmail: string;
  contactPhone: string;
};

export type CertificateRecord = {
  status: DocumentStatus;
  expiry: string;
  reference: string;
};

export type AircraftRecord = {
  id: string;
  operatorId: string;
  registration: string;
  type: string;
  mtowKg: number;
  certificates: {
    registration: CertificateRecord;
    airworthiness: CertificateRecord;
    insurance: CertificateRecord;
    noise: CertificateRecord;
  };
};

export type AgentRecord = {
  id: string;
  name: string;
  agentId: string;
  operatorId: string;
  authorization: VerificationStatus;
  loaReference: string;
  powerOfAttorney: string;
  effectiveDate: string;
  expiryDate: string;
  status: "ACTIVE" | "SUSPENDED" | "EXPIRED";
};

export type DocumentRecord = {
  id: string;
  name: string;
  category: DocumentCategory;
  ownerType: "operator" | "aircraft" | "application";
  ownerId: string;
  status: DocumentStatus;
  expiry: string;
  version: number;
  uploadedAt: string;
  reference: string;
  /** Reviewer verification comment (features.md §8). */
  reviewerComment?: string;
  verifiedBy?: string;
};

export type FlightDetails = {
  flightNumber: string;
  callSign: string;
  passengerCount: number;
  cargo: string;
  purpose: string;
  /** Special information / remarks (features.md §5 special information). */
  specialInfo?: string;
  /** PAX detail (features.md §7). */
  passengerManifest?: string;
  receivingParty?: string;
  receivingPartyContact?: string;
  /** Cargo detail (features.md §7). */
  cargoManifest?: string;
  shipper?: string;
  consignee?: string;
  airWaybill?: string;
};

export type RouteDetails = {
  origin: string;
  originIcao: string;
  destination: string;
  destinationIcao: string;
  entryPoint: string;
  exitPoint: string;
  departureAt: string;
  arrivalAt: string;
  timezone: string;
  /** Estimated entry/exit times (features.md §6). */
  estimatedEntryAt?: string;
  estimatedExitAt?: string;
  /** Landing-specific (features.md §6). */
  departureSlot?: string;
  arrivalSlot?: string;
  groundHandlingAgent?: string;
  purposeOfVisit?: string;
};

export type ValidationCheck = {
  id: string;
  label: string;
  outcome: ValidationOutcome;
  detail: string;
};

export type BillingModel = "Prepaid / Advance Deposit" | "Postpaid";

export type FinanceDetails = {
  permitFee: number;
  processingFee: number;
  currency: string;
  paymentStatus: PaymentStatus;
  financialClearance: FinancialClearance;
  paymentMethod: "Advance Deposit / Wallet" | "Online Payment" | null;
  paidAt: string | null;
  holdReason: string | null;
  /** Billing model and postpaid invoice fields (features.md §12). */
  billingModel: BillingModel;
  invoiceNumber?: string;
  dueDate?: string;
  outstanding?: number;
};

export type RevisionRecord = {
  id: string;
  permitId: string;
  applicationId: string;
  type: RevisionType;
  originalValue: string;
  newValue: string;
  reason: string;
  submittedBy: string;
  submittedAt: string;
  status: RevisionStatus;
  decidedBy: string | null;
  decidedAt: string | null;
};

export type StatusHistoryEntry = {
  status: ApplicationStatus;
  at: string;
  by: string;
  role: Role;
  note: string;
};

export type ApplicationRecord = {
  id: string;
  reference: string;
  operatorId: string;
  agentId: string | null;
  aircraftId: string;
  authorization: PermitAuthorization;
  permitKind: PermitKind;
  category: FlightCategory;
  flight: FlightDetails;
  route: RouteDetails;
  documentIds: string[];
  validation: ValidationCheck[];
  validationResult: ValidationOutcome;
  finance: FinanceDetails;
  status: ApplicationStatus;
  assignedReviewer: string;
  createdAt: string;
  submittedAt: string | null;
  permitId: string | null;
  history: StatusHistoryEntry[];
};

export type PermitRecord = {
  id: string;
  permitNumber: string;
  applicationReference: string;
  operatorId: string;
  aircraftId: string;
  authorization: PermitAuthorization;
  flightNumber: string;
  routeLabel: string;
  entryPoint: string;
  exitPoint: string;
  validFrom: string;
  validUntil: string;
  status: "ISSUED" | "ACTIVE" | "REISSUED" | "EXPIRED" | "REVOKED";
  version: number;
  issuedAt: string;
  signedBy: string;
  /** Agent that submitted on the operator's behalf, if any (features.md §14). */
  agentId?: string | null;
  checksum: string;
  verificationReference: string;
  revisionIds: string[];
};

export type AuditEntry = {
  id: string;
  at: string;
  actor: string;
  role: Role;
  action: string;
  status: string;
  applicationReference: string;
  oldValue: string | null;
  newValue: string | null;
};

export type NotificationRecord = {
  id: string;
  targetRole: NotificationAudience;
  type: string;
  text: string;
  time: string;
  read: boolean;
};

export type RbacPermission = {
  key: string;
  label: string;
  roles: Role[];
};

export type RbacRole = {
  key: string;
  label: string;
  side: "Authority Side" | "Customer Side";
  description: string;
};

export type Counters = {
  newApplications: number;
  underReview: number;
  awaitingFinance: number;
  technicalReview: number;
  awaitingApproval: number;
  approved: number;
  issued: number;
};

export type Wallet = {
  balance: number;
  currency: string;
  outstanding: number;
};

export type AuthorityProfile = {
  name: string;
  shortName: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  /** Name shown on the digital permit signature block. */
  signatory: string;
};

export type DemoWorld = {
  authority: AuthorityProfile;
  operator: OperatorRecord;
  aircraft: AircraftRecord[];
  agents: AgentRecord[];
  documents: DocumentRecord[];
  applications: ApplicationRecord[];
  permits: PermitRecord[];
  revisions: RevisionRecord[];
  audit: AuditEntry[];
  notifications: NotificationRecord[];
  rbacRoles: RbacRole[];
  rbacPermissions: RbacPermission[];
  counters: Counters;
  wallet: Wallet;
};

/** Stable ids for the hero storyline, referenced across screens and scenes. */
export const STORY_IDS = {
  operator: "op-global-wings",
  agent: "ag-aviation-services",
  aircraft: "ac-a6-gwa",
  application: "app-aap-2026-00125",
  applicationReference: "AAP-2026-00125",
  permit: "prm-caa-of-2026-00452",
  permitNumber: "CAA-OF-2026-00452",
  revision: "rev-001",
  reviewer: "Permit Reviewer",
  financeOfficer: "Finance Officer",
  approver: "Permit Approver",
  operatorActor: "Operator Admin",
} as const;
