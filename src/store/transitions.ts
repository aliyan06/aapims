import {
  STORY_IDS,
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
