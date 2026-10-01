# `src/store` — the shared demo world

This is the **single Zustand world** that every portal reads and writes. `src/data` provides the
fictional seed; the store clones it into mutable state and exposes read hooks (selectors) and write
actions. Because all roles share one world, the hero application
(`AAP-2026-00125` / `CAA-OF-2026-00452`) flips status identically everywhere.

Screens **read via selectors** (`useApplication`, `useCounters`, `usePermit`, …) and **mutate only
via actions** (`submitApplication`, `approvePermit`, …). Components never mutate `world` directly.

## Files

| File               | Responsibility                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| `types.ts`         | Store types: `AppState`, `MetaState`, `UiState`, `AppActions`, `AppStore`, `TransitionResult`.  |
| `initial-state.ts` | `buildInitialState()` — a fresh mutable clone of `WORLD`; dev-only deep-freeze of the seed.     |
| `clock.ts`         | The fixed demo clock (10 Oct 2026, 09:00 UTC) and date/time formatting helpers.                 |
| `transitions.ts`   | **Pure** workflow functions that mutate a draft `AppState` and return a `TransitionResult`.     |
| `scenes.ts`        | Presenter scene presets (`scene-0` … `scene-11`) and `getScene`.                                |
| `store.ts`         | The Zustand store: wires transitions to actions, handles cloning, toasts and `lastActionLabel`. |
| `selectors.ts`     | Read hooks and plain helpers used by screens.                                                   |
| `index.ts`         | Public barrel export.                                                                           |

## Pure transitions, testable in isolation

`transitions.ts` contains no React and no store references. Each function takes a draft `AppState`,
mutates it, and returns a `TransitionResult` (`{ ok, label, toast?, value? }`). This makes the whole
permit workflow unit-testable — see `transitions.test.ts` and `scenes.test.ts`. `store.ts` clones the
current state, runs the transition on the draft, pushes the toast and commits with `set`, returning a
boolean success value.

## Actions and their effects

| Action                                             | Effect                                                                                         |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `submitApplication(id)`                            | `DRAFT`/`RETURNED` → **SUBMITTED**; increments `newApplications`, writes audit + notification. |
| `recommendApproval(id)`                            | `SUBMITTED`/`UNDER REVIEW` → **AWAITING FINANCE**.                                             |
| `verifyPayment(id)`                                | Sets finance `paymentStatus` to **PAID** and timestamps it.                                    |
| `placeFinancialHold(id, reason)`                   | Sets financial clearance to **ON HOLD** with a reason.                                         |
| `clearFinancialHold(id)`                           | **AWAITING FINANCE** → **TECHNICAL REVIEW**; marks finance `CLEARED`, clears the hold.         |
| `passTechnicalReview(id)`                          | **TECHNICAL REVIEW** → **AWAITING FINAL APPROVAL**.                                            |
| `approvePermit(id)`                                | **AWAITING FINAL APPROVAL** → **APPROVED**.                                                    |
| `issuePermit(id)`                                  | **APPROVED** → **ISSUED**; creates a new `PermitRecord` and links it to the application.       |
| `requestRevision(input)`                           | Issued permit → **REVISION REQUESTED**; creates a pending `RevisionRecord`.                    |
| `approveRevision(revisionId)`                      | Revision **APPROVED**; permit reissued as **REISSUED V+1** (version incremented).              |
| `rejectRevision(revisionId)`                       | Revision **REJECTED**; permit/application stays `ISSUED`.                                      |
| `returnApplication(id)` / `requestInformation(id)` | → **RETURNED** with an audit note.                                                             |
| `rejectPermit(id, reason)`                         | `AWAITING FINAL APPROVAL`/`UNDER REVIEW` → **REJECTED**.                                       |
| `markNotificationRead(id)`                         | Marks a notification read for the active role.                                                 |
| `setActiveRole(role)`                              | Presenter-only: sets the active role.                                                          |
| `jumpToScene(sceneId)`                             | Rebuilds the world from the seed and applies a scene preset; returns the scene route.          |
| `resetDemo()`                                      | Restores the pristine initial state.                                                           |
| `pushToast(toast)` / `dismissToast(id)`            | UI toast queue.                                                                                |

Every successful transition also appends an audit entry and (where relevant) a notification, using
`state.clock.iso`, so the audit trail and notification centre stay consistent.

## Scenes (retained for tests)

`SCENES` in `scenes.ts` is retained for the deterministic test suite; the presenter panel no longer
exposes scene jumping (it switches role and resets only). Each preset carries a role, route and
clock, and its `apply` function replays the transition chain from the pristine seed.
`jumpToScene(id)` resets the world, sets the clock/role/scene, applies the chain and returns the
route — available to tests and dev tooling.

| Scene      | Label                        | Role     | Route                                              |
| ---------- | ---------------------------- | -------- | -------------------------------------------------- |
| `scene-0`  | 0 · Operator signs in        | operator | `/operator/dashboard`                              |
| `scene-1`  | 1 · Operator dashboard       | operator | `/operator/dashboard`                              |
| `scene-2`  | 2 · Apply for permit         | operator | `/operator/apply`                                  |
| `scene-3`  | 3 · Application submitted    | operator | `/operator/applications/AAP-2026-00125`            |
| `scene-4`  | 4 · Reviewer recommends      | reviewer | `/authority/applications/AAP-2026-00125`           |
| `scene-5`  | 5 · Finance clears funds     | finance  | `/authority/finance/AAP-2026-00125`                |
| `scene-6`  | 6 · Technical review passed  | reviewer | `/authority/applications/AAP-2026-00125/technical` |
| `scene-7`  | 7 · Permit approved & issued | approver | `/authority/permits/CAA-OF-2026-00452`             |
| `scene-8`  | 8 · Public verification      | public   | `/verify`                                          |
| `scene-9`  | 9 · Revision requested       | operator | `/operator/permits/CAA-OF-2026-00452`              |
| `scene-10` | 10 · Revision approved (V2)  | approver | `/authority/permits/CAA-OF-2026-00452`             |
| `scene-11` | 11 · Audit trail             | reviewer | `/authority/audit`                                 |

## Selectors

`selectors.ts` exposes hooks such as `useWorld`, `useCounters`, `useApplications`, `usePermits`,
`useAudit`, `useNotifications(role)`, `useApplication(idOrReference)`, `usePermit(idOrNumber)` and
`useOperatorApplications`, plus `useInspectorSnapshot()` for the dev tooling. Screens should prefer
these hooks over reaching into `useAppStore` directly.

## Dev-only safeguards

- **Deep-freeze.** On startup in development, `initial-state.ts` deep-freezes the imported `WORLD`
  seed. Any accidental direct mutation is caught immediately rather than silently corrupting the
  demo. Production builds skip this.
- **`StoreInspector`.** `useInspectorSnapshot()` returns a flat, primitive-only snapshot (scene,
  role, clock, entity counts, pipeline counters, last action and the hero application status) for
  the dev inspector rendered by `src/components/shell/StoreInspector.tsx`. A primitive-only snapshot
  avoids re-render loops from object identity churn.
