import { create } from "zustand";
import { buildInitialState } from "./initial-state";
import { getScene } from "./scenes";
import type { AppState, AppStore, ToastPayload, TransitionResult } from "./types";
import * as transitions from "./transitions";

let toastSeq = 0;

function nextToastId(): string {
  toastSeq += 1;
  return `toast-${Date.now()}-${toastSeq}`;
}

function cloneState(state: AppState): AppState {
  return {
    meta: JSON.parse(JSON.stringify(state.meta)) as AppState["meta"],
    clock: { ...state.clock },
    world: JSON.parse(JSON.stringify(state.world)) as AppState["world"],
    ui: {
      lastActionLabel: state.ui.lastActionLabel,
      toasts: state.ui.toasts.map((toast) => ({ ...toast })),
    },
  };
}

export const useAppStore = create<AppStore>((set, get) => {
  function run(fn: (state: AppState) => TransitionResult): boolean {
    const draft = cloneState(get());
    const result = fn(draft);

    if (result.toast) {
      const payload: ToastPayload = { id: nextToastId(), ...result.toast };
      draft.ui.toasts.push(payload);
    }
    if (result.ok) {
      draft.ui.lastActionLabel = result.label;
    }
    set({ meta: draft.meta, clock: draft.clock, world: draft.world, ui: draft.ui });
    return result.ok;
  }

  return {
    ...buildInitialState(),

    /* Demo / presenter */
    setActiveRole: (role) => set((state) => ({ meta: { ...state.meta, activeRole: role } })),

    signIn: (role) =>
      set((state) => ({ meta: { ...state.meta, activeRole: role, signedIn: true } })),

    signOut: () => set((state) => ({ meta: { ...state.meta, signedIn: false } })),

    jumpToScene: (sceneId) => {
      const scene = getScene(sceneId);
      if (!scene) return "/";
      const state = buildInitialState();
      state.clock.iso = scene.clock;
      state.meta.activeRole = scene.role;
      state.meta.currentScene = scene.id;
      state.ui.lastActionLabel = `Scene: ${scene.label}`;
      scene.apply(state);
      set({ meta: state.meta, clock: state.clock, world: state.world, ui: state.ui });
      return scene.route;
    },

    resetDemo: () => set(buildInitialState()),

    pushToast: (toast) =>
      set((state) => ({
        ui: { ...state.ui, toasts: [...state.ui.toasts, { id: nextToastId(), ...toast }] },
      })),

    dismissToast: (id) =>
      set((state) => ({
        ui: { ...state.ui, toasts: state.ui.toasts.filter((toast) => toast.id !== id) },
      })),

    /* Permit workflow */
    submitApplication: (id) => run((state) => transitions.submitApplication(state, id)),
    recommendApproval: (id) => run((state) => transitions.recommendApproval(state, id)),
    requestInformation: (id) => run((state) => transitions.requestInformation(state, id)),
    returnApplication: (id) => run((state) => transitions.returnApplication(state, id)),
    verifyPayment: (id) => run((state) => transitions.verifyPayment(state, id)),
    placeFinancialHold: (id, reason) =>
      run((state) => transitions.placeFinancialHold(state, id, reason)),
    clearFinancialHold: (id) => run((state) => transitions.clearFinancialHold(state, id)),
    passTechnicalReview: (id) => run((state) => transitions.passTechnicalReview(state, id)),
    approvePermit: (id) => run((state) => transitions.approvePermit(state, id)),
    rejectPermit: (id, reason) => run((state) => transitions.rejectPermit(state, id, reason)),
    issuePermit: (id) => run((state) => transitions.issuePermit(state, id)),
    requestRevision: (input) => run((state) => transitions.requestRevision(state, input)),
    approveRevision: (id) => run((state) => transitions.approveRevision(state, id)),
    rejectRevision: (id) => run((state) => transitions.rejectRevision(state, id)),
    markNotificationRead: (id) => run((state) => transitions.markNotificationRead(state, id)),

    verifyDocument: (documentId, comment) =>
      run((state) => transitions.verifyDocument(state, documentId, comment)),
    rejectDocument: (documentId, comment) =>
      run((state) => transitions.rejectDocument(state, documentId, comment)),
    requestDocumentReplacement: (documentId, comment) =>
      run((state) => transitions.requestDocumentReplacement(state, documentId, comment)),
    addDocumentObservation: (documentId, comment) =>
      run((state) => transitions.addDocumentObservation(state, documentId, comment)),

    suspendAgent: (agentId) => run((state) => transitions.suspendAgent(state, agentId)),
    reactivateAgent: (agentId) => run((state) => transitions.reactivateAgent(state, agentId)),
    expireAgent: (agentId) => run((state) => transitions.expireAgent(state, agentId)),

    payApplication: (applicationId, method) =>
      run((state) => transitions.payApplication(state, applicationId, method)),

    revokePermit: (permitId, reason) =>
      run((state) => transitions.revokePermit(state, permitId, reason)),
    expirePermit: (permitId) => run((state) => transitions.expirePermit(state, permitId)),
    activatePermit: (permitId) => run((state) => transitions.activatePermit(state, permitId)),
    archiveApplication: (applicationId) =>
      run((state) => transitions.archiveApplication(state, applicationId)),
    sendPermitExpiryReminder: (permitId) =>
      run((state) => transitions.sendPermitExpiryReminder(state, permitId)),

    submitRegistration: () => run((state) => transitions.submitRegistration(state)),
    approveRegistration: () => run((state) => transitions.approveRegistration(state)),
    registerAgent: (input) => run((state) => transitions.registerAgent(state, input)),
    verifyAgent: (agentId) => run((state) => transitions.verifyAgent(state, agentId)),
    registerAircraft: (input) => run((state) => transitions.registerAircraft(state, input)),

    runApplicationValidation: (applicationId) =>
      run((state) => transitions.runApplicationValidation(state, applicationId)),
    validateApplication: (applicationId) =>
      run((state) => transitions.validateApplication(state, applicationId)),
    setBillingModel: (applicationId, model) =>
      run((state) => transitions.setBillingModel(state, applicationId, model)),
  };
});
