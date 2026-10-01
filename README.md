# AAPIMS — Aviation Authority Permit Integrated Management System

A **desktop POC** for the Aviation Authority Permit Integrated Management System (AAPIMS), by
Moavin Technologies. It demonstrates the complete aviation permit lifecycle end to end, from an
operator applying through to public QR verification, revision/reissue and the audit trail.

There is **no backend**: all data is **fictional**, every value comes from the in-app data layer and
Zustand world, and the whole world **resets on refresh**. It is built to be shown to an African
government aviation-authority client and captured for a demo video, so quality and a coherent story
matter more than breadth.

## Tech stack

| Concern           | Technology                                                              |
| ----------------- | ----------------------------------------------------------------------- |
| UI                | React 19                                                                |
| Framework/routing | TanStack Start + TanStack Router (file-based routes, SSR)               |
| Build             | Vite 8 via `@lovable.dev/vite-tanstack-config`                          |
| Language          | TypeScript (strict, no `any`)                                           |
| Styling           | Tailwind CSS v4 with design tokens in `src/styles.css`                  |
| State             | Zustand 5 (single shared demo world)                                    |
| Components        | shadcn/Radix primitives (`src/components/ui`) + a desktop design system |
| Icons / toasts    | lucide-react, sonner                                                    |
| Charts            | recharts                                                                |
| Tests             | Vitest                                                                  |

## Getting started

Uses **npm only**:

```bash
npm install
npm run dev
```

| Script              | Command                         | Purpose                                     |
| ------------------- | ------------------------------- | ------------------------------------------- |
| `npm run dev`       | `vite dev`                      | Start the local dev server.                 |
| `npm run build`     | `vite build`                    | Production build (also regenerates routes). |
| `npm run build:dev` | `vite build --mode development` | Build with development mode flags.          |
| `npm run preview`   | `vite preview`                  | Preview the built output.                   |
| `npm run lint`      | `eslint .`                      | Lint the codebase.                          |
| `npm run format`    | `prettier --write .`            | Format the codebase.                        |
| `npm run test`      | `vitest run`                    | Run the test suite once.                    |

## Quality gate

A task is complete only when all of these pass:

```bash
npm run format
npm run build
npx tsc --noEmit
npm run lint   # 0 errors
npm run test
```

## Repository layout

```
src/
  routes/          File-based routes; each role is a layout route mounting DeviceStage
  components/
    shell/         DeviceStage, DesktopFrame, PresenterPanel, StoreInspector, roles.ts, overlays
    desktop/       The desktop design system (PortalPage, PortalSidebar, DataTable, StatusBadge, …)
    operator/      Operator-portal feature components
    authority/     Authority-portal feature components
    permit/        Shared permit/application components
    ui/            shadcn/Radix primitives
  data/            Typed fictional world (types, seed, taxonomy, lookups, index)
  store/           Zustand world (types, clock, initial-state, transitions, scenes, store, selectors)
  hooks/           Shared React hooks
  lib/             Utilities, including status colours (src/lib/status.ts)
  docs/            BLUEPRINT.md and project documentation
```

## Routes at a glance

| Path            | Description                                                           |
| --------------- | --------------------------------------------------------------------- |
| `/`             | Launcher (HERO entry point).                                          |
| `/login`        | Mock login; selects a role and routes to its dashboard.               |
| `/operator/*`   | Operator portal (dashboard, aircraft, documents, apply, permits, …).  |
| `/authority/*`  | Authority portal (review, finance, technical, approval, audit, …).    |
| `/verify`       | Public QR/reference verification (no login).                          |
| Presenter panel | Demo controls to switch role and reset the world (outside the frame). |

## Architecture summary

- **Shared world.** All roles read and write the same Zustand world. `src/data` provides the typed
  fictional dataset; `src/store` clones it into mutable state. The hero application
  (`AAP-2026-00125`) flips status identically in every portal.
- **Demo clock.** A fixed "today" (10 October 2026, 09:00 UTC) drives timestamps and formatting via
  `src/store/clock.ts`.
- **Presenter.** The presenter panel switches the active role and resets the world. Status changes
  are driven live through the portal screens. (`src/store/scenes.ts` retains deterministic scene
  presets used by the test suite; they are not exposed in the presenter UI.)
- **Desktop only.** Every role renders inside a desktop browser frame (`DeviceStage`); no mobile
  surfaces. The presenter panel and dev inspector stay **outside** the frame.
- **Routing note.** Routes are file-based. A file `foo.tsx` plus a directory `foo/` makes `foo.tsx`
  a layout parent; use a trailing underscore (`foo_.$id.tsx`) for a detail route at the parent path.
  Adding or renaming a route **requires `npm run build`** to regenerate `routeTree.gen.ts` — never
  hand-edit it.

## Demo accounts

All accounts use the password **`demo123`**.

| Email                    | Role            |
| ------------------------ | --------------- |
| `operator@demo.com`      | Operator        |
| `reviewer@authority.gov` | Permit Reviewer |
| `finance@authority.gov`  | Finance Officer |
| `approver@authority.gov` | Permit Approver |

## Reading order / lifecycle

The end-to-end story runs:

```
Apply → Review → Finance → Technical → Approve → Issue → Verify → Revise → Audit
```

The permit status lifecycle is:

```
DRAFT → SUBMITTED → UNDER REVIEW → AWAITING FINANCE → TECHNICAL REVIEW
      → AWAITING FINAL APPROVAL → APPROVED → ISSUED
REVISION REQUESTED → REISSUED
RETURNED · REJECTED · EXPIRED · REVOKED · ARCHIVED
```

See `docs/BLUEPRINT.md` for the source-of-truth specification, `src/data/README.md` for the data
layer, and `src/store/README.md` for the state layer.
