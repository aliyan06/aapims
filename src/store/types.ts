import type { ApplicationRecord, DemoWorld, RevisionType, Role } from "@/data/types";

export type ToastTone = "default" | "success" | "error" | "info";

export type ToastPayload = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
};

export type MetaState = {
  activeRole: Role;
  currentScene: string;
  /** Mock authenticated session (features.md §1/§20). */
  signedIn: boolean;
};

export type ClockState = {
  iso: string;
};

export type UiState = {
  toasts: ToastPayload[];
  lastActionLabel: string;
};

export type AppState = {
  meta: MetaState;
  clock: ClockState;
  world: DemoWorld;
  ui: UiState;
};

export type TransitionResult = {
  ok: boolean;
  label: string;
  toast?: Omit<ToastPayload, "id">;
  value?: unknown;
};

export type RequestRevisionInput = {
  permitId: string;
  type: RevisionType;
  originalValue: string;
  newValue: string;
  reason: string;
};

export type RegisterAgentInput = {
  name: string;
  agentId: string;
  loaReference: string;
  powerOfAttorney: string;
  effectiveDate: string;
  expiryDate: string;
};

export type RegisterAircraftInput = {
  registration: string;
  type: string;
  mtowKg: number;
};

export type AppActions = {
  /* Demo / presenter */
  setActiveRole: (role: Role) => void;
  signIn: (role: Role) => void;
  signOut: () => void;
  jumpToScene: (sceneId: string) => string;
  resetDemo: () => void;
  pushToast: (toast: Omit<ToastPayload, "id">) => void;
  dismissToast: (id: string) => void;

  /* Permit workflow */
  submitApplication: (applicationId: string) => boolean;
  recommendApproval: (applicationId: string) => boolean;
  requestInformation: (applicationId: string) => boolean;
  returnApplication: (applicationId: string) => boolean;
  verifyPayment: (applicationId: string) => boolean;
  placeFinancialHold: (applicationId: string, reason: string) => boolean;
  clearFinancialHold: (applicationId: string) => boolean;
  passTechnicalReview: (applicationId: string) => boolean;
  approvePermit: (applicationId: string) => boolean;
  rejectPermit: (applicationId: string, reason: string) => boolean;
  issuePermit: (applicationId: string) => boolean;
  requestRevision: (input: RequestRevisionInput) => boolean;
  approveRevision: (revisionId: string) => boolean;
  rejectRevision: (revisionId: string) => boolean;
  markNotificationRead: (notificationId: string) => boolean;

  /* Document verification */
  verifyDocument: (documentId: string, comment?: string) => boolean;
  rejectDocument: (documentId: string, comment?: string) => boolean;
  requestDocumentReplacement: (documentId: string, comment?: string) => boolean;
  addDocumentObservation: (documentId: string, comment: string) => boolean;

  /* Agent management */
  suspendAgent: (agentId: string) => boolean;
  reactivateAgent: (agentId: string) => boolean;
  expireAgent: (agentId: string) => boolean;

  /* Operator payment */
  payApplication: (applicationId: string, method: "wallet" | "online") => boolean;

  /* Permit status */
  revokePermit: (permitId: string, reason: string) => boolean;
  expirePermit: (permitId: string) => boolean;
  activatePermit: (permitId: string) => boolean;
  archiveApplication: (applicationId: string) => boolean;
  sendPermitExpiryReminder: (permitId: string) => boolean;

  /* Registration & operator management */
  submitRegistration: () => boolean;
  approveRegistration: () => boolean;
  registerAgent: (input: RegisterAgentInput) => boolean;
  verifyAgent: (agentId: string) => boolean;
  registerAircraft: (input: RegisterAircraftInput) => boolean;

  /* Validation & billing */
  runApplicationValidation: (applicationId: string) => boolean;
  validateApplication: (applicationId: string) => boolean;
  setBillingModel: (
    applicationId: string,
    model: "Prepaid / Advance Deposit" | "Postpaid",
  ) => boolean;
};

export type AppStore = AppState & AppActions;

export type Selector<T> = (state: AppStore) => T;

export type { ApplicationRecord };
