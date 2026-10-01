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
  };
});
