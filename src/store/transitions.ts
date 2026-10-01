import {
  STORY_IDS,
  type AircraftRecord,
  type AgentRecord,
  type ApplicationRecord,
  type ApplicationStatus,
  type AuditEntry,
  type Counters,
  type NotificationAudience,
  type NotificationRecord,
  type PermitRecord,
  type RevisionRecord,
  type Role,
} from "@/data/types";
import type { AppState, RequestRevisionInput, TransitionResult } from "./types";

type CounterKey = keyof Counters;

const STATUS_COUNTER: Partial<Record<ApplicationStatus, CounterKey>> = {
  SUBMITTED: "newApplications",
  "UNDER REVIEW": "underReview",
  "AWAITING FINANCE": "awaitingFinance",
  "TECHNICAL REVIEW": "technicalReview",
  "AWAITING FINAL APPROVAL": "awaitingApproval",
  APPROVED: "approved",
  ISSUED: "issued",
  REISSUED: "issued",
};

function counterKeyFor(status: ApplicationStatus): CounterKey | undefined {
  return STATUS_COUNTER[status];
}

function adjust(state: AppState, key: CounterKey | undefined, delta: number): void {
  if (!key) return;
  const next = state.world.counters[key] + delta;
  state.world.counters[key] = Math.max(0, next);
}

function findApplication(state: AppState, id: string): ApplicationRecord | undefined {
  return state.world.applications.find((item) => item.id === id || item.reference === id);
}

function nextId(prefix: string, length: number): string {
  return `${prefix}-${String(length + 1).padStart(3, "0")}`;
}

function addAudit(
  state: AppState,
  entry: {
    actor: string;
    role: Role;
    action: string;
    status: string;
    applicationReference: string;
    oldValue?: string | null;
    newValue?: string | null;
  },
): void {
  const record: AuditEntry = {
    id: nextId("aud", state.world.audit.length),
    at: state.clock.iso,
    actor: entry.actor,
    role: entry.role,
    action: entry.action,
    status: entry.status,
    applicationReference: entry.applicationReference,
    oldValue: entry.oldValue ?? null,
    newValue: entry.newValue ?? null,
  };
  state.world.audit.unshift(record);
}

function notify(
  state: AppState,
  targetRole: NotificationAudience,
  type: string,
  text: string,
): void {
  const record: NotificationRecord = {
    id: nextId("ntf", state.world.notifications.length),
    targetRole,
    type,
    text,
    time: state.clock.iso,
    read: false,
  };
  state.world.notifications.unshift(record);
}

function setStatus(
  app: ApplicationRecord,
  status: ApplicationStatus,
  at: string,
  by: string,
  role: Role,
  note: string,
): void {
  app.status = status;
  app.history.push({ status, at, by, role, note });
}

function fail(label: string, message: string): TransitionResult {
  return { ok: false, label, toast: { title: message, tone: "error" } };
}

function done(
  label: string,
  message: string,
  tone: "success" | "info" = "success",
): TransitionResult {
  return { ok: true, label, toast: { title: message, tone } };
}

/* ------------------------------------------------------------------ */
/* Operator actions                                                    */
/* ------------------------------------------------------------------ */

export function submitApplication(state: AppState, applicationId: string): TransitionResult {
  const app = findApplication(state, applicationId);
  const label = "Submit application";
  if (!app) return fail(label, "Application not found.");
  if (app.status !== "DRAFT" && app.status !== "RETURNED") {
    return fail(label, `Only draft or returned applications can be submitted.`);
  }
  // Enforce verified operator + valid agent authorization (features.md §3).
  if (app.agentId) {
    const agent = state.world.agents.find((item) => item.id === app.agentId);
    if (!agent || agent.authorization !== "VERIFIED" || agent.status !== "ACTIVE") {
      return fail(
        label,
        "The linked agent authorization is not valid. Update or remove the agent before submitting.",
      );
    }
  }
  const previous = app.status;
  setStatus(
    app,
    "SUBMITTED",
    state.clock.iso,
    STORY_IDS.operatorActor,
    "operatorAdmin",
    "Application submitted for review.",
  );
  app.submittedAt = state.clock.iso;
  adjust(state, counterKeyFor(previous), -1);
  adjust(state, "newApplications", 1);
  addAudit(state, {
    actor: STORY_IDS.operatorActor,
    role: "operatorAdmin",
    action: "Application submitted",
    status: "SUBMITTED",
    applicationReference: app.reference,
    oldValue: previous,
    newValue: "SUBMITTED",
  });
  notify(state, "reviewer", "APPLICATION", `New application ${app.reference} is awaiting review.`);
  return { ...done(label, `Application ${app.reference} submitted.`), value: app.reference };
}

export function requestRevision(state: AppState, input: RequestRevisionInput): TransitionResult {
  const label = "Request revision";
  const permit = state.world.permits.find(
    (item) => item.id === input.permitId || item.permitNumber === input.permitId,
  );
  if (!permit) return fail(label, "Permit not found.");
  const app = state.world.applications.find(
    (item) => item.reference === permit.applicationReference,
  );
  if (!app) return fail(label, "Application not found.");
  if (app.status !== "ISSUED" && app.status !== "REISSUED") {
    return fail(label, "Only an issued permit can be revised.");
  }
  const revision: RevisionRecord = {
    id: nextId("rev", state.world.revisions.length),
    permitId: permit.id,
    applicationId: app.id,
    type: input.type,
    originalValue: input.originalValue,
    newValue: input.newValue,
    reason: input.reason,
    submittedBy: STORY_IDS.operatorActor,
    submittedAt: state.clock.iso,
    status: "PENDING",
    decidedBy: null,
    decidedAt: null,
  };
  state.world.revisions.unshift(revision);
  permit.revisionIds.push(revision.id);
  const previous = app.status;
  setStatus(
    app,
    "REVISION REQUESTED",
    state.clock.iso,
    STORY_IDS.operatorActor,
    "operatorAdmin",
    `${input.type} requested.`,
  );
  adjust(state, counterKeyFor(previous), -1);
  addAudit(state, {
    actor: STORY_IDS.operatorActor,
    role: "operatorAdmin",
    action: `Revision requested — ${input.type}`,
    status: "REVISION REQUESTED",
    applicationReference: app.reference,
    oldValue: input.originalValue,
    newValue: input.newValue,
  });
  notify(state, "approver", "REVISION", `Revision requested on permit ${permit.permitNumber}.`);
  return { ...done(label, `Revision requested on ${permit.permitNumber}.`), value: revision.id };
}

/* ------------------------------------------------------------------ */
/* Authority — reviewer                                                */
/* ------------------------------------------------------------------ */

export function recommendApproval(state: AppState, applicationId: string): TransitionResult {
  const app = findApplication(state, applicationId);
  const label = "Recommend approval";
  if (!app) return fail(label, "Application not found.");
  if (app.status !== "SUBMITTED" && app.status !== "UNDER REVIEW") {
    return fail(label, "Only a submitted or in-review application can be recommended.");
  }
  const previous = app.status;
  setStatus(
    app,
    "AWAITING FINANCE",
    state.clock.iso,
    STORY_IDS.reviewer,
    "reviewer",
    "Recommended for approval.",
  );
  adjust(state, counterKeyFor(previous), -1);
  adjust(state, "awaitingFinance", 1);
  addAudit(state, {
    actor: STORY_IDS.reviewer,
    role: "reviewer",
    action: "Recommended approval",
    status: "AWAITING FINANCE",
    applicationReference: app.reference,
    oldValue: previous,
    newValue: "AWAITING FINANCE",
  });
  notify(state, "finance", "FINANCE", `Application ${app.reference} awaits financial clearance.`);
  return done(label, `${app.reference} forwarded to finance.`);
}

export function requestInformation(state: AppState, applicationId: string): TransitionResult {
  return returnApplication(state, applicationId, "Request information", "Information requested");
}

export function returnApplication(
  state: AppState,
  applicationId: string,
  label = "Return application",
  auditAction = "Application returned",
): TransitionResult {
  const app = findApplication(state, applicationId);
  if (!app) return fail(label, "Application not found.");
  if (app.status === "ISSUED" || app.status === "REISSUED" || app.status === "REJECTED") {
    return fail(label, "This application can no longer be returned.");
  }
  const previous = app.status;
  setStatus(app, "RETURNED", state.clock.iso, STORY_IDS.reviewer, "reviewer", auditAction);
  adjust(state, counterKeyFor(previous), -1);
  addAudit(state, {
    actor: STORY_IDS.reviewer,
    role: "reviewer",
    action: auditAction,
    status: "RETURNED",
    applicationReference: app.reference,
    oldValue: previous,
    newValue: "RETURNED",
  });
  notify(
    state,
    "customer",
    "APPLICATION",
    `Application ${app.reference} was returned for correction.`,
  );
  return done(label, `${app.reference} returned to the operator.`, "info");
}

export function passTechnicalReview(state: AppState, applicationId: string): TransitionResult {
  const app = findApplication(state, applicationId);
  const label = "Pass technical review";
  if (!app) return fail(label, "Application not found.");
  if (app.status !== "TECHNICAL REVIEW") {
    return fail(label, "Technical review can only run after financial clearance.");
  }
  setStatus(
    app,
    "AWAITING FINAL APPROVAL",
    state.clock.iso,
    STORY_IDS.reviewer,
    "reviewer",
    "Technical review passed.",
  );
  adjust(state, "technicalReview", -1);
  adjust(state, "awaitingApproval", 1);
  addAudit(state, {
    actor: STORY_IDS.reviewer,
    role: "reviewer",
    action: "Technical review passed",
    status: "AWAITING FINAL APPROVAL",
    applicationReference: app.reference,
    oldValue: "TECHNICAL REVIEW",
    newValue: "AWAITING FINAL APPROVAL",
  });
  notify(state, "approver", "APPROVAL", `Application ${app.reference} awaits final approval.`);
  return done(label, `${app.reference} passed technical review.`);
}

/* ------------------------------------------------------------------ */
/* Authority — finance                                                 */
/* ------------------------------------------------------------------ */

export function verifyPayment(state: AppState, applicationId: string): TransitionResult {
  const app = findApplication(state, applicationId);
  const label = "Verify payment";
  if (!app) return fail(label, "Application not found.");
  if (app.finance.paymentStatus === "PAID") {
    return fail(label, "Payment is already verified.");
  }
  app.finance.paymentStatus = "PAID";
  app.finance.paidAt = state.clock.iso;
  addAudit(state, {
    actor: STORY_IDS.financeOfficer,
    role: "finance",
    action: "Payment verified",
    status: "PAID",
    applicationReference: app.reference,
    oldValue: "UNPAID",
    newValue: "PAID",
  });
  notify(state, "customer", "PAYMENT", `Payment received for ${app.reference}.`);
  return done(label, `Payment verified for ${app.reference}.`);
}

export function placeFinancialHold(
  state: AppState,
  applicationId: string,
  reason: string,
): TransitionResult {
  const app = findApplication(state, applicationId);
  const label = "Place financial hold";
  if (!app) return fail(label, "Application not found.");
  app.finance.financialClearance = "ON HOLD";
  app.finance.holdReason = reason;
  addAudit(state, {
    actor: STORY_IDS.financeOfficer,
    role: "finance",
    action: "Financial hold placed",
    status: "ON HOLD",
    applicationReference: app.reference,
    oldValue: "PENDING CLEARANCE",
    newValue: "ON HOLD",
  });
  notify(state, "customer", "FINANCE", `A financial hold was placed on ${app.reference}.`);
  return done(label, `Financial hold placed on ${app.reference}.`, "info");
}

export function clearFinancialHold(state: AppState, applicationId: string): TransitionResult {
  const app = findApplication(state, applicationId);
  const label = "Clear financial hold";
  if (!app) return fail(label, "Application not found.");
  if (app.status !== "AWAITING FINANCE") {
    return fail(label, "This application is not at the finance stage.");
  }
  app.finance.financialClearance = "CLEARED";
  app.finance.holdReason = null;
  if (app.finance.paymentStatus !== "PAID") {
    app.finance.paymentStatus = "PAID";
    app.finance.paidAt = state.clock.iso;
  }
  setStatus(
    app,
    "TECHNICAL REVIEW",
    state.clock.iso,
    STORY_IDS.financeOfficer,
    "finance",
    "Financial clearance granted.",
  );
  adjust(state, "awaitingFinance", -1);
  adjust(state, "technicalReview", 1);
  addAudit(state, {
    actor: STORY_IDS.financeOfficer,
    role: "finance",
    action: "Financial clearance",
    status: "TECHNICAL REVIEW",
    applicationReference: app.reference,
    oldValue: "PENDING CLEARANCE",
    newValue: "CLEARED",
  });
  notify(state, "reviewer", "TECHNICAL", `${app.reference} is clear for technical review.`);
  return done(label, `${app.reference} cleared for technical review.`);
}

/* ------------------------------------------------------------------ */
/* Authority — approver                                                */
/* ------------------------------------------------------------------ */

export function approvePermit(state: AppState, applicationId: string): TransitionResult {
  const app = findApplication(state, applicationId);
  const label = "Approve permit";
  if (!app) return fail(label, "Application not found.");
  if (app.status !== "AWAITING FINAL APPROVAL") {
    return fail(label, "Only an application awaiting final approval can be approved.");
  }
  setStatus(app, "APPROVED", state.clock.iso, STORY_IDS.approver, "approver", "Permit approved.");
  adjust(state, "awaitingApproval", -1);
  adjust(state, "approved", 1);
  addAudit(state, {
    actor: STORY_IDS.approver,
    role: "approver",
    action: "Permit approved",
    status: "APPROVED",
    applicationReference: app.reference,
    oldValue: "AWAITING FINAL APPROVAL",
    newValue: "APPROVED",
  });
  notify(state, "customer", "APPROVAL", `Application ${app.reference} has been approved.`);
  return done(label, `${app.reference} approved. Ready for issuance.`);
}

export function rejectPermit(
  state: AppState,
  applicationId: string,
  reason: string,
): TransitionResult {
  const app = findApplication(state, applicationId);
  const label = "Reject permit";
  if (!app) return fail(label, "Application not found.");
  if (app.status !== "AWAITING FINAL APPROVAL" && app.status !== "UNDER REVIEW") {
    return fail(label, "This application cannot be rejected at this stage.");
  }
  const previous = app.status;
  setStatus(
    app,
    "REJECTED",
    state.clock.iso,
    STORY_IDS.approver,
    "approver",
    reason || "Application rejected.",
  );
  adjust(state, counterKeyFor(previous), -1);
  addAudit(state, {
    actor: STORY_IDS.approver,
    role: "approver",
    action: "Permit rejected",
    status: "REJECTED",
    applicationReference: app.reference,
    oldValue: previous,
    newValue: "REJECTED",
  });
  notify(state, "customer", "APPLICATION", `Application ${app.reference} was rejected.`);
  return done(label, `${app.reference} rejected.`, "info");
}

export function issuePermit(state: AppState, applicationId: string): TransitionResult {
  const app = findApplication(state, applicationId);
  const label = "Issue digital permit";
  if (!app) return fail(label, "Application not found.");
  if (app.status !== "APPROVED") {
    return fail(label, "Only an approved application can be issued.");
  }

  const isHero = app.reference === STORY_IDS.applicationReference;
  const permitNumber = isHero
    ? STORY_IDS.permitNumber
    : `CAA-${app.authorization === "OVERFLIGHT" ? "OF" : "LD"}-2026-${String(500 + state.world.permits.length).padStart(5, "0")}`;

  const permit: PermitRecord = {
    id: isHero ? STORY_IDS.permit : `prm-${app.reference.toLowerCase()}`,
    permitNumber,
    applicationReference: app.reference,
    operatorId: app.operatorId,
    aircraftId: app.aircraftId,
    authorization: app.authorization,
    flightNumber: app.flight.flightNumber,
    routeLabel: `${app.route.origin} → ${app.route.destination}`,
    entryPoint: app.route.entryPoint,
    exitPoint: app.route.exitPoint,
    validFrom: app.route.departureAt.slice(0, 10),
    validUntil: app.route.arrivalAt.slice(0, 10),
    status: "ISSUED",
    version: 1,
    issuedAt: state.clock.iso,
    signedBy: state.world.authority.signatory,
    checksum: `CHK-${app.reference.slice(-3)}-2026`,
    verificationReference: `VRF-${app.reference.slice(-3)}-2026`,
    agentId: app.agentId,
    revisionIds: [],
  };
  state.world.permits.unshift(permit);
  app.permitId = permit.id;

  setStatus(
    app,
    "ISSUED",
    state.clock.iso,
    STORY_IDS.approver,
    "approver",
    "Digital permit issued.",
  );
  adjust(state, "approved", -1);
  adjust(state, "issued", 1);
  addAudit(state, {
    actor: "System",
    role: "approver",
    action: "Digital permit issued",
    status: "ISSUED",
    applicationReference: app.reference,
    oldValue: "APPROVED",
    newValue: "ISSUED",
  });
  notify(state, "customer", "PERMIT", `Permit ${permit.permitNumber} has been issued.`);
  notify(state, "public", "PERMIT", `Permit ${permit.permitNumber} is now verifiable.`);
  return { ...done(label, `Permit ${permit.permitNumber} issued.`), value: permit.permitNumber };
}

export function approveRevision(state: AppState, revisionId: string): TransitionResult {
  const label = "Approve revision";
  const revision = state.world.revisions.find((item) => item.id === revisionId);
  if (!revision) return fail(label, "Revision not found.");
  if (revision.status !== "PENDING") return fail(label, "Revision already decided.");
  const permit = state.world.permits.find((item) => item.id === revision.permitId);
  const app = state.world.applications.find((item) => item.id === revision.applicationId);
  if (!permit || !app) return fail(label, "Permit or application not found.");

  revision.status = "APPROVED";
  revision.decidedBy = STORY_IDS.approver;
  revision.decidedAt = state.clock.iso;
  permit.version += 1;
  permit.status = "REISSUED";
  setStatus(
    app,
    "REISSUED",
    state.clock.iso,
    STORY_IDS.approver,
    "approver",
    "Revision approved and permit reissued.",
  );
  adjust(state, "issued", 0);
  addAudit(state, {
    actor: STORY_IDS.approver,
    role: "approver",
    action: "Revision approved — permit reissued",
    status: "REISSUED",
    applicationReference: app.reference,
    oldValue: `V${permit.version - 1}`,
    newValue: `V${permit.version}`,
  });
  notify(
    state,
    "customer",
    "REVISION",
    `Revision approved. Permit ${permit.permitNumber} reissued as V${permit.version}.`,
  );
  return {
    ...done(label, `Permit ${permit.permitNumber} reissued as V${permit.version}.`),
    value: permit.permitNumber,
  };
}

export function rejectRevision(state: AppState, revisionId: string): TransitionResult {
  const label = "Reject revision";
  const revision = state.world.revisions.find((item) => item.id === revisionId);
  if (!revision) return fail(label, "Revision not found.");
  if (revision.status !== "PENDING") return fail(label, "Revision already decided.");
  const permit = state.world.permits.find((item) => item.id === revision.permitId);
  const app = state.world.applications.find((item) => item.id === revision.applicationId);
  if (!permit || !app) return fail(label, "Permit or application not found.");

  revision.status = "REJECTED";
  revision.decidedBy = STORY_IDS.approver;
  revision.decidedAt = state.clock.iso;
  setStatus(
    app,
    "ISSUED",
    state.clock.iso,
    STORY_IDS.approver,
    "approver",
    "Revision rejected; permit unchanged.",
  );
  addAudit(state, {
    actor: STORY_IDS.approver,
    role: "approver",
    action: "Revision rejected",
    status: "ISSUED",
    applicationReference: app.reference,
    oldValue: `V${permit.version}`,
    newValue: `V${permit.version}`,
  });
  notify(
    state,
    "customer",
    "REVISION",
    `Revision rejected. Permit ${permit.permitNumber} is unchanged.`,
  );
  return done(label, `Revision rejected.`, "info");
}

export function markNotificationRead(state: AppState, notificationId: string): TransitionResult {
  const notification = state.world.notifications.find((item) => item.id === notificationId);
  if (!notification) return fail("Mark read", "Notification not found.");
  notification.read = true;
  return { ok: true, label: "Notification read" };
}

/* ------------------------------------------------------------------ */
/* Permit status actions (features.md §17)                             */
/* ------------------------------------------------------------------ */

function setPermitTerminal(
  state: AppState,
  permitId: string,
  status: "REVOKED" | "EXPIRED",
  label: string,
  reason: string,
): TransitionResult {
  const permit = state.world.permits.find(
    (item) => item.id === permitId || item.permitNumber === permitId,
  );
  if (!permit) return fail(label, "Permit not found.");
  if (permit.status === "REVOKED" || permit.status === "EXPIRED") {
    return fail(label, `Permit ${permit.permitNumber} is already ${permit.status}.`);
  }
  const previous = permit.status;
  permit.status = status;
  const app = state.world.applications.find(
    (item) => item.reference === permit.applicationReference,
  );
  if (app) {
    app.status = status;
    app.history.push({
      status,
      at: state.clock.iso,
      by: STORY_IDS.approver,
      role: "approver",
      note: reason,
    });
  }
  addAudit(state, {
    actor: STORY_IDS.approver,
    role: "approver",
    action: `${label} — ${permit.permitNumber}`,
    status,
    applicationReference: permit.applicationReference,
    oldValue: previous,
    newValue: status,
  });
  notify(state, "customer", "PERMIT", `Permit ${permit.permitNumber} is now ${status}.`);
  return done(label, `Permit ${permit.permitNumber} ${status.toLowerCase()}.`, "info");
}

export function revokePermit(state: AppState, permitId: string, reason: string): TransitionResult {
  return setPermitTerminal(
    state,
    permitId,
    "REVOKED",
    "Revoke permit",
    reason || "Permit revoked.",
  );
}

export function expirePermit(state: AppState, permitId: string): TransitionResult {
  return setPermitTerminal(
    state,
    permitId,
    "EXPIRED",
    "Mark permit expired",
    "Permit validity period ended.",
  );
}

/* ------------------------------------------------------------------ */
/* Document verification (features.md §8)                              */
/* ------------------------------------------------------------------ */

function findDocument(state: AppState, documentId: string) {
  return state.world.documents.find((item) => item.id === documentId);
}

export function verifyDocument(
  state: AppState,
  documentId: string,
  comment?: string,
): TransitionResult {
  const label = "Verify document";
  const doc = findDocument(state, documentId);
  if (!doc) return fail(label, "Document not found.");
  doc.status = "VALID";
  doc.verifiedBy = STORY_IDS.reviewer;
  doc.reviewerComment = comment || "Document verified against the source.";
  addAudit(state, {
    actor: STORY_IDS.reviewer,
    role: "reviewer",
    action: `Document verified — ${doc.name}`,
    status: "VALID",
    applicationReference: doc.reference,
    oldValue: "PENDING VERIFICATION",
    newValue: "VALID",
  });
  notify(state, "customer", "DOCUMENT", `${doc.name} was verified.`);
  return done(label, `${doc.name} verified.`);
}

export function rejectDocument(
  state: AppState,
  documentId: string,
  comment?: string,
): TransitionResult {
  const label = "Reject document";
  const doc = findDocument(state, documentId);
  if (!doc) return fail(label, "Document not found.");
  doc.status = "REJECTED";
  doc.verifiedBy = STORY_IDS.reviewer;
  doc.reviewerComment = comment || "Document rejected; a replacement is required.";
  addAudit(state, {
    actor: STORY_IDS.reviewer,
    role: "reviewer",
    action: `Document rejected — ${doc.name}`,
    status: "REJECTED",
    applicationReference: doc.reference,
    oldValue: "PENDING VERIFICATION",
    newValue: "REJECTED",
  });
  notify(state, "customer", "DOCUMENT", `${doc.name} was rejected. Please upload a replacement.`);
  return done(label, `${doc.name} rejected.`, "info");
}

export function requestDocumentReplacement(
  state: AppState,
  documentId: string,
  comment?: string,
): TransitionResult {
  const label = "Request replacement";
  const doc = findDocument(state, documentId);
  if (!doc) return fail(label, "Document not found.");
  doc.status = "PENDING VERIFICATION";
  doc.verifiedBy = STORY_IDS.reviewer;
  doc.reviewerComment = comment || "Replacement requested.";
  addAudit(state, {
    actor: STORY_IDS.reviewer,
    role: "reviewer",
    action: `Replacement requested — ${doc.name}`,
    status: "PENDING VERIFICATION",
    applicationReference: doc.reference,
    oldValue: doc.status,
    newValue: "PENDING VERIFICATION",
  });
  notify(state, "customer", "DOCUMENT", `Replacement requested for ${doc.name}.`);
  return done(label, `Replacement requested for ${doc.name}.`, "info");
}

export function addDocumentObservation(
  state: AppState,
  documentId: string,
  comment: string,
): TransitionResult {
  const label = "Add observation";
  const doc = findDocument(state, documentId);
  if (!doc) return fail(label, "Document not found.");
  doc.reviewerComment = comment || doc.reviewerComment || "Observation recorded.";
  doc.verifiedBy = STORY_IDS.reviewer;
  addAudit(state, {
    actor: STORY_IDS.reviewer,
    role: "reviewer",
    action: `Observation added — ${doc.name}`,
    status: doc.status,
    applicationReference: doc.reference,
    oldValue: null,
    newValue: comment || "Observation",
  });
  return done(label, `Observation recorded on ${doc.name}.`, "info");
}

/* ------------------------------------------------------------------ */
/* Agent management (features.md §3)                                   */
/* ------------------------------------------------------------------ */

function setAgentStatus(
  state: AppState,
  agentId: string,
  status: "ACTIVE" | "SUSPENDED" | "EXPIRED",
  label: string,
): TransitionResult {
  const agent = state.world.agents.find((item) => item.id === agentId);
  if (!agent) return fail(label, "Agent not found.");
  const previous = agent.status;
  agent.status = status;
  addAudit(state, {
    actor: STORY_IDS.operatorActor,
    role: "operatorAdmin",
    action: `${label} — ${agent.name}`,
    status,
    applicationReference: agent.id,
    oldValue: previous,
    newValue: status,
  });
  return done(label, `${agent.name} is now ${status.toLowerCase()}.`, "info");
}

export function suspendAgent(state: AppState, agentId: string): TransitionResult {
  return setAgentStatus(state, agentId, "SUSPENDED", "Suspend agent");
}

export function reactivateAgent(state: AppState, agentId: string): TransitionResult {
  return setAgentStatus(state, agentId, "ACTIVE", "Reactivate agent");
}

export function expireAgent(state: AppState, agentId: string): TransitionResult {
  return setAgentStatus(state, agentId, "EXPIRED", "Expire agent authorization");
}

/* ------------------------------------------------------------------ */
/* Operator payment (features.md §12)                                  */
/* ------------------------------------------------------------------ */

export function payApplication(
  state: AppState,
  applicationId: string,
  method: "wallet" | "online",
): TransitionResult {
  const app = findApplication(state, applicationId);
  const label = "Pay permit fees";
  if (!app) return fail(label, "Application not found.");
  if (app.finance.paymentStatus === "PAID") {
    return fail(label, "These fees are already paid.");
  }
  const total = app.finance.permitFee + app.finance.processingFee;

  if (method === "wallet") {
    if (state.world.wallet.balance < total) {
      return fail(label, "Insufficient wallet balance for this payment.");
    }
    state.world.wallet.balance -= total;
    app.finance.paymentMethod = "Advance Deposit / Wallet";
  } else {
    app.finance.paymentMethod = "Online Payment";
  }

  app.finance.paymentStatus = "PAID";
  app.finance.paidAt = state.clock.iso;
  app.finance.outstanding = 0;
  addAudit(state, {
    actor: STORY_IDS.operatorActor,
    role: "operatorAdmin",
    action: "Permit fees paid",
    status: "PAID",
    applicationReference: app.reference,
    oldValue: "UNPAID",
    newValue: "PAID",
  });
  notify(state, "finance", "PAYMENT", `Payment received for ${app.reference}.`);
  return done(label, `Paid ${app.finance.currency} ${total} for ${app.reference}.`);
}

/* ------------------------------------------------------------------ */
/* Operator registration & KYC (features.md �2)                        */
/* ------------------------------------------------------------------ */

export function submitRegistration(state: AppState): TransitionResult {
  const label = "Submit registration";
  const operator = state.world.operator;
  if (operator.kycStatus === "SUBMITTED" || operator.kycStatus === "UNDER REVIEW") {
    return fail(label, "Registration is already submitted for verification.");
  }
  if (operator.kycStatus === "ACTIVE") {
    return fail(label, "This operator account is already active.");
  }
  operator.kycStatus = "SUBMITTED";
  addAudit(state, {
    actor: STORY_IDS.operatorActor,
    role: "operatorAdmin",
    action: "Operator registration submitted",
    status: "SUBMITTED",
    applicationReference: operator.operatorId,
    oldValue: "DRAFT",
    newValue: "SUBMITTED",
  });
  notify(
    state,
    "reviewer",
    "REGISTRATION",
    `Operator ${operator.company} submitted registration for verification.`,
  );
  return done(label, "Registration submitted for verification.");
}

export function approveRegistration(state: AppState): TransitionResult {
  const label = "Approve registration";
  const operator = state.world.operator;
  if (operator.kycStatus === "ACTIVE") {
    return fail(label, "This operator account is already active.");
  }
  const previous = operator.kycStatus;
  operator.kycStatus = "ACTIVE";
  addAudit(state, {
    actor: STORY_IDS.reviewer,
    role: "reviewer",
    action: "Operator registration approved (KYC)",
    status: "ACTIVE",
    applicationReference: operator.operatorId,
    oldValue: previous,
    newValue: "ACTIVE",
  });
  notify(
    state,
    "customer",
    "REGISTRATION",
    `${operator.company} is now an active verified operator.`,
  );
  return done(label, `${operator.company} approved and activated.`);
}

/* ------------------------------------------------------------------ */
/* Agent registration & verification (features.md �3)                  */
/* ------------------------------------------------------------------ */

export function registerAgent(
  state: AppState,
  input: {
    name: string;
    agentId: string;
    loaReference: string;
    powerOfAttorney: string;
    effectiveDate: string;
    expiryDate: string;
  },
): TransitionResult {
  const label = "Register agent";
  if (!input.name.trim() || !input.agentId.trim()) {
    return fail(label, "Agent name and agent ID are required.");
  }
  const record: AgentRecord = {
    id: `ag-${input.agentId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: input.name.trim(),
    agentId: input.agentId.trim(),
    operatorId: state.world.operator.id,
    authorization: "PENDING VERIFICATION",
    loaReference: input.loaReference || "Pending",
    powerOfAttorney: input.powerOfAttorney || "Pending",
    effectiveDate: input.effectiveDate,
    expiryDate: input.expiryDate,
    status: "ACTIVE",
  };
  state.world.agents.push(record);
  addAudit(state, {
    actor: STORY_IDS.operatorActor,
    role: "operatorAdmin",
    action: `Agent registered � ${record.name}`,
    status: "PENDING VERIFICATION",
    applicationReference: record.agentId,
    oldValue: null,
    newValue: record.agentId,
  });
  notify(
    state,
    "reviewer",
    "AGENT",
    `Agent ${record.name} was registered and awaits verification.`,
  );
  return {
    ...done(label, `${record.name} registered and pending verification.`, "info"),
    value: record.id,
  };
}

export function verifyAgent(state: AppState, agentId: string): TransitionResult {
  const label = "Verify agent";
  const agent = state.world.agents.find((item) => item.id === agentId);
  if (!agent) return fail(label, "Agent not found.");
  agent.authorization = "VERIFIED";
  addAudit(state, {
    actor: STORY_IDS.reviewer,
    role: "reviewer",
    action: `Agent verified � ${agent.name}`,
    status: "VERIFIED",
    applicationReference: agent.agentId,
    oldValue: "PENDING VERIFICATION",
    newValue: "VERIFIED",
  });
  notify(state, "customer", "AGENT", `Agent ${agent.name} authorization is verified.`);
  return done(label, `${agent.name} verified.`);
}

/* ------------------------------------------------------------------ */
/* Aircraft registration (features.md �2)                              */
/* ------------------------------------------------------------------ */

export function registerAircraft(
  state: AppState,
  input: { registration: string; type: string; mtowKg: number },
): TransitionResult {
  const label = "Register aircraft";
  if (!input.registration.trim() || !input.type.trim()) {
    return fail(label, "Aircraft registration and type are required.");
  }
  if (
    state.world.aircraft.some(
      (item) => item.registration.toLowerCase() === input.registration.trim().toLowerCase(),
    )
  ) {
    return fail(label, `Aircraft ${input.registration} is already registered.`);
  }
  const pending = {
    status: "PENDING VERIFICATION" as const,
    expiry: "2028-12-31",
    reference: "Pending",
  };
  const record: AircraftRecord = {
    id: `ac-${input.registration.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    operatorId: state.world.operator.id,
    registration: input.registration.trim().toUpperCase(),
    type: input.type.trim(),
    mtowKg: input.mtowKg,
    certificates: {
      registration: { ...pending },
      airworthiness: { ...pending },
      insurance: { ...pending },
      noise: { ...pending },
    },
  };
  state.world.aircraft.push(record);
  addAudit(state, {
    actor: STORY_IDS.operatorActor,
    role: "operatorAdmin",
    action: `Aircraft registered � ${record.registration}`,
    status: "PENDING VERIFICATION",
    applicationReference: record.registration,
    oldValue: null,
    newValue: record.registration,
  });
  return {
    ...done(label, `${record.registration} registered and pending verification.`, "info"),
    value: record.id,
  };
}

/* ------------------------------------------------------------------ */
/* Automated validation (features.md �9)                               */
/* ------------------------------------------------------------------ */

export function runApplicationValidation(state: AppState, applicationId: string): TransitionResult {
  const label = "Run validation";
  const app = findApplication(state, applicationId);
  if (!app) return fail(label, "Application not found.");
  const world = state.world;
  const operator = world.operator;
  const today = state.clock.iso.slice(0, 10);
  const aircraft = world.aircraft.find((item) => item.id === app.aircraftId);
  const docs = app.documentIds
    .map((id) => world.documents.find((doc) => doc.id === id))
    .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc));
  const agent = app.agentId ? world.agents.find((item) => item.id === app.agentId) : undefined;
  const total = app.finance.permitFee + app.finance.processingFee;

  const checks = [
    {
      id: "v-operator",
      label: "Operator verified",
      pass: operator.status === "VERIFIED",
      detail: `${operator.operatorId} status ${operator.status}.`,
    },
    {
      id: "v-aoc",
      label: "AOC valid",
      pass: operator.aocValidUntil >= today,
      detail: `AOC valid until ${operator.aocValidUntil}.`,
    },
    {
      id: "v-aircraft",
      label: "Aircraft valid",
      pass: Boolean(aircraft),
      detail: aircraft ? `${aircraft.registration} on register.` : "Aircraft not found.",
    },
    {
      id: "v-insurance",
      label: "Insurance valid",
      pass: aircraft ? aircraft.certificates.insurance.status === "VALID" : false,
      detail: aircraft ? `Insurance ${aircraft.certificates.insurance.status}.` : "No aircraft.",
    },
    {
      id: "v-docs",
      label: "Required documents available",
      pass:
        docs.length === app.documentIds.length &&
        docs.every((doc) => doc.status !== "EXPIRED" && doc.status !== "MISSING"),
      detail: `${docs.length}/${app.documentIds.length} documents present.`,
    },
    {
      id: "v-agent",
      label: "Agent authorization valid",
      pass: !app.agentId || (agent?.authorization === "VERIFIED" && agent.status === "ACTIVE"),
      detail: app.agentId
        ? agent
          ? `${agent.name} ${agent.authorization}.`
          : "Agent missing."
        : "No agent used.",
    },
    {
      id: "v-route",
      label: "Route complete",
      pass: Boolean(app.route.origin && app.route.destination),
      detail: `${app.route.origin} to ${app.route.destination}.`,
    },
    {
      id: "v-entry",
      label: "Entry point provided",
      pass: Boolean(app.route.entryPoint),
      detail: app.route.entryPoint || "Missing.",
    },
    {
      id: "v-exit",
      label: "Exit point provided",
      pass: Boolean(app.route.exitPoint),
      detail: app.route.exitPoint || "Missing.",
    },
    {
      id: "v-schedule",
      label: "Schedule complete",
      pass: Boolean(app.route.departureAt && app.route.arrivalAt),
      detail: "Departure and arrival set.",
    },
    {
      id: "v-duplicate",
      label: "Duplicate application check",
      pass: !world.applications.some(
        (other) =>
          other.id !== app.id &&
          other.flight.flightNumber.toLowerCase() === app.flight.flightNumber.toLowerCase() &&
          other.route.departureAt.slice(0, 10) === app.route.departureAt.slice(0, 10) &&
          other.status !== "REJECTED" &&
          other.status !== "ARCHIVED",
      ),
      detail: "No overlapping application for this flight and date.",
    },
    {
      id: "v-financial",
      label: "Financial eligibility check",
      pass: app.finance.paymentStatus === "PAID" || world.wallet.balance >= total,
      detail:
        app.finance.paymentStatus === "PAID"
          ? "Fees paid."
          : `Wallet balance ${world.wallet.balance} / required ${total}.`,
    },
  ];

  app.validation = checks.map((check) => ({
    id: check.id,
    label: check.label,
    outcome: check.pass ? "PASS" : "WARNING",
    detail: check.detail,
  }));
  const failed = app.validation.filter((check) => check.outcome !== "PASS").length;
  app.validationResult = failed === 0 ? "PASS" : "WARNING";
  return {
    ...done(
      label,
      failed === 0 ? "All checks passed." : `${failed} check(s) need attention.`,
      failed === 0 ? "success" : "info",
    ),
    value: app.validationResult,
  };
}

export function validateApplication(state: AppState, applicationId: string): TransitionResult {
  const label = "Validate application";
  const app = findApplication(state, applicationId);
  if (!app) return fail(label, "Application not found.");
  if (app.status === "SUBMITTED") {
    setStatus(
      app,
      "UNDER REVIEW",
      state.clock.iso,
      STORY_IDS.reviewer,
      "reviewer",
      "Application validated.",
    );
    adjust(state, "newApplications", -1);
    adjust(state, "underReview", 1);
  }
  addAudit(state, {
    actor: STORY_IDS.reviewer,
    role: "reviewer",
    action: "Application validated",
    status: app.status,
    applicationReference: app.reference,
    oldValue: "SUBMITTED",
    newValue: app.status,
  });
  return done(label, `${app.reference} validated and moved to review.`);
}

/* ------------------------------------------------------------------ */
/* Archive, activate, expiry reminder (features.md �17/�19)            */
/* ------------------------------------------------------------------ */

export function archiveApplication(state: AppState, applicationId: string): TransitionResult {
  const label = "Archive application";
  const app = findApplication(state, applicationId);
  if (!app) return fail(label, "Application not found.");
  if (app.status === "ARCHIVED") return fail(label, "Application is already archived.");
  const previous = app.status;
  setStatus(
    app,
    "ARCHIVED",
    state.clock.iso,
    STORY_IDS.operatorActor,
    "operatorAdmin",
    "Application archived.",
  );
  adjust(state, counterKeyFor(previous), -1);
  addAudit(state, {
    actor: STORY_IDS.operatorActor,
    role: "operatorAdmin",
    action: "Application archived",
    status: "ARCHIVED",
    applicationReference: app.reference,
    oldValue: previous,
    newValue: "ARCHIVED",
  });
  return done(label, `${app.reference} archived.`, "info");
}

export function activatePermit(state: AppState, permitId: string): TransitionResult {
  const label = "Activate permit";
  const permit = state.world.permits.find(
    (item) => item.id === permitId || item.permitNumber === permitId,
  );
  if (!permit) return fail(label, "Permit not found.");
  if (permit.status !== "ISSUED" && permit.status !== "REISSUED") {
    return fail(label, "Only an issued permit can be activated.");
  }
  permit.status = "ACTIVE";
  const app = state.world.applications.find(
    (item) => item.reference === permit.applicationReference,
  );
  if (app) {
    app.status = "ACTIVE";
    app.history.push({
      status: "ACTIVE",
      at: state.clock.iso,
      by: STORY_IDS.approver,
      role: "approver",
      note: "Permit activated.",
    });
  }
  addAudit(state, {
    actor: STORY_IDS.approver,
    role: "approver",
    action: `Permit activated � ${permit.permitNumber}`,
    status: "ACTIVE",
    applicationReference: permit.applicationReference,
    oldValue: "ISSUED",
    newValue: "ACTIVE",
  });
  notify(state, "customer", "PERMIT", `Permit ${permit.permitNumber} is active.`);
  return done(label, `Permit ${permit.permitNumber} activated.`);
}

export function sendPermitExpiryReminder(state: AppState, permitId: string): TransitionResult {
  const label = "Send expiry reminder";
  const permit = state.world.permits.find(
    (item) => item.id === permitId || item.permitNumber === permitId,
  );
  if (!permit) return fail(label, "Permit not found.");
  notify(
    state,
    "customer",
    "EXPIRING",
    `Permit ${permit.permitNumber} expires on ${permit.validUntil}.`,
  );
  addAudit(state, {
    actor: STORY_IDS.approver,
    role: "approver",
    action: `Expiry reminder sent � ${permit.permitNumber}`,
    status: permit.status,
    applicationReference: permit.applicationReference,
    oldValue: null,
    newValue: permit.validUntil,
  });
  return done(label, `Expiry reminder sent for ${permit.permitNumber}.`, "info");
}

/* ------------------------------------------------------------------ */
/* Billing model (features.md �12)                                     */
/* ------------------------------------------------------------------ */

export function setBillingModel(
  state: AppState,
  applicationId: string,
  model: "Prepaid / Advance Deposit" | "Postpaid",
): TransitionResult {
  const label = "Set billing model";
  const app = findApplication(state, applicationId);
  if (!app) return fail(label, "Application not found.");
  const previous = app.finance.billingModel;
  const total = app.finance.permitFee + app.finance.processingFee;
  app.finance.billingModel = model;
  if (model === "Postpaid") {
    app.finance.invoiceNumber = app.finance.invoiceNumber ?? `INV-2026-${app.reference.slice(-3)}`;
    app.finance.dueDate = app.finance.dueDate ?? state.clock.iso.slice(0, 10);
    app.finance.outstanding = app.finance.paymentStatus === "PAID" ? 0 : total;
  } else {
    app.finance.invoiceNumber = undefined;
    app.finance.dueDate = undefined;
    app.finance.outstanding = app.finance.paymentStatus === "PAID" ? 0 : total;
  }
  addAudit(state, {
    actor: STORY_IDS.financeOfficer,
    role: "finance",
    action: `Billing model set � ${model}`,
    status: model,
    applicationReference: app.reference,
    oldValue: previous,
    newValue: model,
  });
  return done(label, `${app.reference} set to ${model}.`, "info");
}
