import { describe, expect, it } from "vitest";
import { STORY_IDS } from "@/data/types";
import { buildInitialState } from "./initial-state";
import {
  approvePermit,
  approveRevision,
  clearFinancialHold,
  issuePermit,
  passTechnicalReview,
  payApplication,
  recommendApproval,
  rejectPermit,
  requestInformation,
  requestRevision,
  submitApplication,
  submitRegistration,
  suspendAgent,
  verifyDocument,
  registerAircraft,
  activatePermit,
} from "./transitions";

const APP = STORY_IDS.application;

function heroStatus(state: ReturnType<typeof buildInitialState>) {
  return state.world.applications.find((item) => item.id === APP)?.status;
}

describe("permit workflow transitions", () => {
  it("walks the hero application through the full lifecycle", () => {
    const state = buildInitialState();
    expect(heroStatus(state)).toBe("DRAFT");

    expect(submitApplication(state, APP).ok).toBe(true);
    expect(heroStatus(state)).toBe("SUBMITTED");

    expect(recommendApproval(state, APP).ok).toBe(true);
    expect(heroStatus(state)).toBe("AWAITING FINANCE");

    expect(clearFinancialHold(state, APP).ok).toBe(true);
    expect(heroStatus(state)).toBe("TECHNICAL REVIEW");

    expect(passTechnicalReview(state, APP).ok).toBe(true);
    expect(heroStatus(state)).toBe("AWAITING FINAL APPROVAL");

    expect(approvePermit(state, APP).ok).toBe(true);
    expect(heroStatus(state)).toBe("APPROVED");

    expect(issuePermit(state, APP).ok).toBe(true);
    expect(heroStatus(state)).toBe("ISSUED");

    const permit = state.world.permits.find((item) => item.permitNumber === STORY_IDS.permitNumber);
    expect(permit).toBeDefined();
    expect(permit?.version).toBe(1);
  });

  it("records an audit entry for every status change", () => {
    const state = buildInitialState();
    const before = state.world.audit.length;
    submitApplication(state, APP);
    recommendApproval(state, APP);
    expect(state.world.audit.length).toBe(before + 2);
    expect(state.world.audit[0].applicationReference).toBe(STORY_IDS.applicationReference);
  });

  it("enforces preconditions instead of skipping the pipeline", () => {
    const state = buildInitialState();
    const result = recommendApproval(state, APP);
    expect(result.ok).toBe(false);
    expect(result.toast?.tone).toBe("error");
    expect(heroStatus(state)).toBe("DRAFT");
  });

  it("never lets counters go negative", () => {
    const state = buildInitialState();
    requestInformation(state, APP);
    requestInformation(state, APP);
    for (const value of Object.values(state.world.counters)) {
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });

  it("supports revision and reissue (V1 -> V2)", () => {
    const state = buildInitialState();
    submitApplication(state, APP);
    recommendApproval(state, APP);
    clearFinancialHold(state, APP);
    passTechnicalReview(state, APP);
    approvePermit(state, APP);
    issuePermit(state, APP);

    const revisionResult = requestRevision(state, {
      permitId: STORY_IDS.permit,
      type: "Date / Time Change",
      originalValue: "08:30 UTC",
      newValue: "10:00 UTC",
      reason: "Operational schedule change",
    });
    expect(revisionResult.ok).toBe(true);
    expect(heroStatus(state)).toBe("REVISION REQUESTED");

    const revision = state.world.revisions[0];
    expect(revision.status).toBe("PENDING");

    expect(approveRevision(state, revision.id).ok).toBe(true);
    expect(heroStatus(state)).toBe("REISSUED");
    const permit = state.world.permits.find((item) => item.permitNumber === STORY_IDS.permitNumber);
    expect(permit?.version).toBe(2);
    expect(permit?.status).toBe("REISSUED");
  });

  it("blocks submission when the linked agent authorization is not active", () => {
    const state = buildInitialState();
    expect(suspendAgent(state, STORY_IDS.agent).ok).toBe(true);
    const result = submitApplication(state, APP);
    expect(result.ok).toBe(false);
    expect(heroStatus(state)).toBe("DRAFT");
  });

  it("verifies a document and records the reviewer", () => {
    const state = buildInitialState();
    expect(verifyDocument(state, "doc-gwa-aoc", "Checked against the register.").ok).toBe(true);
    const doc = state.world.documents.find((item) => item.id === "doc-gwa-aoc");
    expect(doc?.status).toBe("VALID");
    expect(doc?.reviewerComment).toBe("Checked against the register.");
  });

  it("pays from the wallet and reduces the balance", () => {
    const state = buildInitialState();
    const hero = state.world.applications.find((item) => item.id === APP);
    if (!hero) throw new Error("hero application missing");
    hero.finance.paymentStatus = "UNPAID";
    const before = state.world.wallet.balance;
    expect(payApplication(state, APP, "wallet").ok).toBe(true);
    expect(hero.finance.paymentStatus).toBe("PAID");
    expect(state.world.wallet.balance).toBe(before - 550);
  });

  it("submits operator registration for verification", () => {
    const state = buildInitialState();
    expect(state.world.operator.kycStatus).toBe("ACTIVE");
    state.world.operator.kycStatus = "DRAFT";
    expect(submitRegistration(state).ok).toBe(true);
    expect(state.world.operator.kycStatus).toBe("SUBMITTED");
  });

  it("registers a new aircraft onto the operator account", () => {
    const state = buildInitialState();
    const before = state.world.aircraft.length;
    expect(
      registerAircraft(state, { registration: "A6-NEW", type: "Airbus A321neo", mtowKg: 97000 }).ok,
    ).toBe(true);
    expect(state.world.aircraft.length).toBe(before + 1);
    expect(state.world.aircraft.some((item) => item.registration === "A6-NEW")).toBe(true);
  });

  it("activates an issued permit", () => {
    const state = buildInitialState();
    submitApplication(state, APP);
    recommendApproval(state, APP);
    clearFinancialHold(state, APP);
    passTechnicalReview(state, APP);
    approvePermit(state, APP);
    issuePermit(state, APP);
    expect(activatePermit(state, STORY_IDS.permit).ok).toBe(true);
    const permit = state.world.permits.find((item) => item.permitNumber === STORY_IDS.permitNumber);
    expect(permit?.status).toBe("ACTIVE");
  });

  it("rejects a permit from the approval stage", () => {
    const state = buildInitialState();
    submitApplication(state, APP);
    recommendApproval(state, APP);
    clearFinancialHold(state, APP);
    passTechnicalReview(state, APP);
    expect(rejectPermit(state, APP, "Does not meet requirements").ok).toBe(true);
    expect(heroStatus(state)).toBe("REJECTED");
  });
});
