import { useShallow } from "zustand/react/shallow";
import type { DemoWorld, Role } from "@/data/types";
import { useAppStore } from "./store";

export const useWorld = (): DemoWorld => useAppStore((s) => s.world);
export const useActiveRole = (): Role => useAppStore((s) => s.meta.activeRole);
export const useCurrentScene = (): string => useAppStore((s) => s.meta.currentScene);
export const useClockIso = (): string => useAppStore((s) => s.clock.iso);
export const useLastAction = (): string => useAppStore((s) => s.ui.lastActionLabel);

export const useCounters = () => useAppStore((s) => s.world.counters);
export const useOperator = () => useAppStore((s) => s.world.operator);
export const useWallet = () => useAppStore((s) => s.world.wallet);
export const useAircraft = () => useAppStore((s) => s.world.aircraft);
export const useAgents = () => useAppStore((s) => s.world.agents);
export const useDocuments = () => useAppStore((s) => s.world.documents);
export const useApplications = () => useAppStore((s) => s.world.applications);
export const usePermits = () => useAppStore((s) => s.world.permits);
export const useRevisions = () => useAppStore((s) => s.world.revisions);
export const useAudit = () => useAppStore((s) => s.world.audit);
export const useRbacRoles = () => useAppStore((s) => s.world.rbacRoles);
export const useRbacPermissions = () => useAppStore((s) => s.world.rbacPermissions);
export const useAuthority = () => useAppStore((s) => s.world.authority);

export function useApplication(idOrReference: string) {
  return useAppStore((s) =>
    s.world.applications.find(
      (item) => item.id === idOrReference || item.reference === idOrReference,
    ),
  );
}

export function usePermit(idOrNumber: string) {
  return useAppStore((s) =>
    s.world.permits.find((item) => item.id === idOrNumber || item.permitNumber === idOrNumber),
  );
}

export function useAircraftItem(id: string) {
  return useAppStore((s) => s.world.aircraft.find((item) => item.id === id));
}

export function useAgentItem(id: string | null) {
  return useAppStore((s) => (id ? s.world.agents.find((item) => item.id === id) : undefined));
}

/**
 * Filtered arrays must be referentially stable or React's useSyncExternalStore
 * sees a new snapshot on every render and loops. useShallow keeps the previous
 * array when the filtered elements are unchanged.
 */
export function useOperatorApplications() {
  return useAppStore(
    useShallow((s) =>
      s.world.applications.filter((application) => application.operatorId === s.world.operator.id),
    ),
  );
}

export function useNotifications(role: Role) {
  return useAppStore(
    useShallow((s) =>
      s.world.notifications.filter((notification) => notification.targetRole === role),
    ),
  );
}

export function useUnreadCount(role: Role) {
  return useAppStore(
    (s) =>
      s.world.notifications.filter(
        (notification) => notification.targetRole === role && !notification.read,
      ).length,
  );
}

export function useNotificationSummary() {
  return useAppStore(
    useShallow((s) => ({
      operator: s.world.notifications.filter((n) => n.targetRole === "operator").length,
      reviewer: s.world.notifications.filter((n) => n.targetRole === "reviewer").length,
      finance: s.world.notifications.filter((n) => n.targetRole === "finance").length,
      approver: s.world.notifications.filter((n) => n.targetRole === "approver").length,
      public: s.world.notifications.filter((n) => n.targetRole === "public").length,
    })),
  );
}

/** Flat, primitive-only snapshot for the dev StoreInspector. */
export function useInspectorSnapshot() {
  return useAppStore(
    useShallow((s) => ({
      scene: s.meta.currentScene,
      role: s.meta.activeRole,
      clock: s.clock.iso,
      applications: s.world.applications.length,
      permits: s.world.permits.length,
      revisions: s.world.revisions.length,
      audit: s.world.audit.length,
      newApplications: s.world.counters.newApplications,
      underReview: s.world.counters.underReview,
      awaitingFinance: s.world.counters.awaitingFinance,
      technicalReview: s.world.counters.technicalReview,
      awaitingApproval: s.world.counters.awaitingApproval,
      approved: s.world.counters.approved,
      issued: s.world.counters.issued,
      lastAction: s.ui.lastActionLabel,
      heroStatus:
        s.world.applications.find((a) => a.reference === "AAP-2026-00125")?.status ?? "not created",
    })),
  );
}

/* Plain helpers (no hooks) for use inside event handlers. */
export function getApplicationById(world: DemoWorld, idOrReference: string) {
  return world.applications.find(
    (item) => item.id === idOrReference || item.reference === idOrReference,
  );
}
