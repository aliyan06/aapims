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

export type AppActions = {
  /* Demo / presenter */
  setActiveRole: (role: Role) => void;
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
};

export type AppStore = AppState & AppActions;

export type Selector<T> = (state: AppStore) => T;

export type { ApplicationRecord };
