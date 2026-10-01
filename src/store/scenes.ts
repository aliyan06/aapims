import type { Role } from "@/data/types";
import type { AppState } from "./types";
import {
  approvePermit,
  approveRevision,
  clearFinancialHold,
  issuePermit,
  passTechnicalReview,
  recommendApproval,
  requestRevision,
  submitApplication,
} from "./transitions";

export type ScenePreset = {
  id: string;
  label: string;
  role: Role;
  clock: string;
  route: string;
  apply: (state: AppState) => void;
};

/**
 * Hero id literals are declared here (not read from an imported binding) so this
 * module has no module-scope dependency on another module's initialisation.
 * Under the chunked production SSR bundle, module-scope reads of imported values
 * can hit an uninitialised binding and crash every request.
 */
const HERO_APP = "app-aap-2026-00125";
const HERO_REF = "AAP-2026-00125";
const HERO_PERMIT = "prm-caa-of-2026-00452";
const HERO_PERMIT_NUMBER = "CAA-OF-2026-00452";

export const SCENES: readonly ScenePreset[] = [
  {
    id: "scene-0",
    label: "0 · Operator signs in",
    role: "operatorAdmin",
    clock: "2026-10-10T09:00:00.000Z",
    route: "/operator/dashboard",
    apply: () => {},
  },
  {
    id: "scene-1",
    label: "1 · Operator dashboard",
    role: "operatorAdmin",
    clock: "2026-10-10T09:05:00.000Z",
    route: "/operator/dashboard",
    apply: () => {},
  },
  {
    id: "scene-2",
    label: "2 · Apply for permit",
    role: "operatorAdmin",
    clock: "2026-10-10T09:10:00.000Z",
    route: "/operator/apply",
    apply: () => {},
  },
  {
    id: "scene-3",
    label: "3 · Application submitted",
    role: "operatorAdmin",
    clock: "2026-10-10T09:20:00.000Z",
    route: `/operator/applications/${HERO_REF}`,
    apply: (state) => {
      submitApplication(state, HERO_APP);
    },
  },
  {
    id: "scene-4",
    label: "4 · Reviewer recommends",
    role: "reviewer",
    clock: "2026-10-10T10:05:00.000Z",
    route: `/authority/applications/${HERO_REF}`,
    apply: (state) => {
      submitApplication(state, HERO_APP);
      recommendApproval(state, HERO_APP);
    },
  },
  {
    id: "scene-5",
    label: "5 · Finance clears funds",
    role: "finance",
    clock: "2026-10-10T10:40:00.000Z",
    route: `/authority/finance/${HERO_REF}`,
    apply: (state) => {
      submitApplication(state, HERO_APP);
      recommendApproval(state, HERO_APP);
      clearFinancialHold(state, HERO_APP);
    },
  },
  {
    id: "scene-6",
    label: "6 · Technical review passed",
    role: "reviewer",
    clock: "2026-10-10T11:15:00.000Z",
    route: `/authority/applications/${HERO_REF}/technical`,
    apply: (state) => {
      submitApplication(state, HERO_APP);
      recommendApproval(state, HERO_APP);
      clearFinancialHold(state, HERO_APP);
      passTechnicalReview(state, HERO_APP);
    },
  },
  {
    id: "scene-7",
    label: "7 · Permit approved & issued",
    role: "approver",
    clock: "2026-10-10T11:50:00.000Z",
    route: `/authority/permits/${HERO_PERMIT_NUMBER}`,
    apply: (state) => {
      submitApplication(state, HERO_APP);
      recommendApproval(state, HERO_APP);
      clearFinancialHold(state, HERO_APP);
      passTechnicalReview(state, HERO_APP);
      approvePermit(state, HERO_APP);
      issuePermit(state, HERO_APP);
    },
  },
  {
    id: "scene-8",
    label: "8 · Public verification",
    role: "public",
    clock: "2026-10-10T12:05:00.000Z",
    route: "/verify",
    apply: (state) => {
      submitApplication(state, HERO_APP);
      recommendApproval(state, HERO_APP);
      clearFinancialHold(state, HERO_APP);
      passTechnicalReview(state, HERO_APP);
      approvePermit(state, HERO_APP);
      issuePermit(state, HERO_APP);
    },
  },
  {
    id: "scene-9",
    label: "9 · Revision requested",
    role: "operatorAdmin",
    clock: "2026-10-10T14:30:00.000Z",
    route: `/operator/permits/${HERO_PERMIT_NUMBER}`,
    apply: (state) => {
      submitApplication(state, HERO_APP);
      recommendApproval(state, HERO_APP);
      clearFinancialHold(state, HERO_APP);
      passTechnicalReview(state, HERO_APP);
      approvePermit(state, HERO_APP);
      issuePermit(state, HERO_APP);
      requestRevision(state, {
        permitId: HERO_PERMIT,
        type: "Date / Time Change",
        originalValue: "15 Oct 2026 — 08:30 UTC",
        newValue: "15 Oct 2026 — 10:00 UTC",
        reason: "Operational schedule change",
      });
    },
  },
  {
    id: "scene-10",
    label: "10 · Revision approved (V2)",
    role: "approver",
    clock: "2026-10-10T15:10:00.000Z",
    route: `/authority/permits/${HERO_PERMIT_NUMBER}`,
    apply: (state) => {
      submitApplication(state, HERO_APP);
      recommendApproval(state, HERO_APP);
      clearFinancialHold(state, HERO_APP);
      passTechnicalReview(state, HERO_APP);
      approvePermit(state, HERO_APP);
      issuePermit(state, HERO_APP);
      requestRevision(state, {
        permitId: HERO_PERMIT,
        type: "Date / Time Change",
        originalValue: "15 Oct 2026 — 08:30 UTC",
        newValue: "15 Oct 2026 — 10:00 UTC",
        reason: "Operational schedule change",
      });
      approveRevision(state, "rev-001");
    },
  },
  {
    id: "scene-11",
    label: "11 · Audit trail",
    role: "reviewer",
    clock: "2026-10-10T15:30:00.000Z",
    route: "/authority/audit",
    apply: (state) => {
      submitApplication(state, HERO_APP);
      recommendApproval(state, HERO_APP);
      clearFinancialHold(state, HERO_APP);
      passTechnicalReview(state, HERO_APP);
      approvePermit(state, HERO_APP);
      issuePermit(state, HERO_APP);
      requestRevision(state, {
        permitId: HERO_PERMIT,
        type: "Date / Time Change",
        originalValue: "15 Oct 2026 — 08:30 UTC",
        newValue: "15 Oct 2026 — 10:00 UTC",
        reason: "Operational schedule change",
      });
      approveRevision(state, "rev-001");
    },
  },
];

export function getScene(id: string): ScenePreset | undefined {
  return SCENES.find((scene) => scene.id === id);
}
