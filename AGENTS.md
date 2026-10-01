# AGENTS.md — AAPIMS demo

Working rules for AI coding agents on the AAPIMS demo project.

## Rule 0 — use sub-agents aggressively

- Delegate work to sub-agents whenever a task can be parallelised or explored independently. Use **as many as needed**, not just one or two.
- Keep the main agent on the critical path (shared interfaces, integration, verification). Fan out screens, components, docs and research.
- Every sub-agent must be given a precise contract (files, exported API, token/styling rules) so its output drops in without rework.

## What this project is

A **desktop POC** for the Aviation Authority Permit Integrated Management System (AAPIMS), by Moavin Technologies. It demonstrates the complete permit lifecycle end to end. There is **no backend**; all data is **fictional** and the world **resets on refresh**. It is shown to an African government client and captured for a video, so quality and clarity matter more than breadth.

## First, always

1. Read `docs/BLUEPRINT.md` — the source of truth (scope, screens, routes, statuses, storyline, theme).
2. If a request conflicts with the blueprint, stop and report the conflict.
3. If something is ambiguous, prefer the blueprint; if silent, choose the simplest option and note it.

## Hard rules

- **Desktop only.** Every role renders in the desktop browser frame. No phone/mobile surfaces.
- **One shared world.** All roles read and write the same `src/store` Zustand world, so the hero application flips status identically everywhere.
- **All data from the data layer + store.** Never hardcode names, numbers, dates, permit references or statuses in components. Read through store selectors; mutate only through store actions.
- **Never import raw constants from `src/data` in screens**; `STORY_IDS`, `taxonomy` and `type` imports are the only exceptions. Read state via `src/store`.
- **Never derive a module-scope value from an imported binding** (e.g. `const X = DEMO_NOW.slice(...)` at file top). Under the chunked production SSR bundle imports can be uninitialised and crash every request. Compute at render time / inside functions.
- **No hardcoded colours.** Use design tokens from `src/styles.css` (`bg-primary`, `text-accent`, `bg-status-approved-soft`, …). Status colours come from `src/lib/status.ts`.
- **Moavin logo** (`/moavin-logo.jpeg`) is used exactly as supplied — never redraw, recolour, stretch or crop it. AAPIMS stays the primary identity.
- **No new heavy dependencies.** Prefer what is installed. No backend, auth, network calls or secrets. No `localStorage` dependency for correctness.
- TypeScript strict, no `any` (except generated files). One component per file. Named exports for components.
- Keep the presenter panel and dev inspector **outside** the device frame.
- **Do not change the pinned `vite` (8.1.5) / `rolldown` (1.1.0) override** without rebuilding and booting the production SSR server (`NITRO_PRESET=node-server npm run build` → `node .output/server/index.mjs`) and smoking every route. Vite 8.2.x breaks the Nitro SSR chunk (every route 500s while `vite build` passes) — see README.

## Architecture (already built — build on it)

- `src/data/` — typed fictional world (`types.ts`, `seed.ts`, `taxonomy.ts`, `lookups.ts`, `index.ts`).
- `src/store/` — Zustand world: `types`, `clock`, `initial-state`, `transitions` (pure), `scenes`, `store`, `selectors`. Reads via `@/store` hooks; writes via `@/store` actions.
- `src/components/shell/` — `DeviceStage`, `DesktopFrame`, `PresenterPanel`, `StoreInspector`, `roles.ts`, overlays.
- `src/components/desktop/` — **the desktop design system** (`PortalPage`, `PortalSidebar`, `PortalTopbar`, `SectionCard`, `KpiTile`, `DataTable`, `StatusBadge`, `Timeline`, `Drawer`, `Checklist`, `StepIndicator`, `DescriptionList`, `EmptyState`, `Field`, `ActionBar`, `UnderlineTabs`, `Brand`).
- `src/components/ui/` — shadcn/Radix primitives.
- Routes are file-based; each role is a layout route mounting `DeviceStage`; leaves mirror the blueprint screen IDs.

## Routing conventions

- `src/routes/<role>.tsx` is a layout parent that renders `<DeviceStage>` + `<Outlet/>`.
- Leaf routes live under `src/routes/<role>/…`.
- A file `foo.tsx` plus a directory `foo/` makes `foo.tsx` a layout parent; use a trailing-underscore escape (`foo_.$id.tsx`) for a detail route at the parent path.
- Adding/renaming a route **requires** `npm run build` to regenerate `routeTree.gen.ts`. Never hand-edit it.

## Quality bar

- No dead ends on the story path. Every button on a HERO screen changes state sensibly.
- Realistic aviation-authority copy. No lorem ipsum, no placeholder names.
- Consistent status colours and spacing across portals.
- Must pass `npm run format`, `npm run build`, `npx tsc --noEmit`, `npm run lint` (0 errors) and `npm run test` before a task is done.

## Workflow

- Do the assigned task only; do not refactor unrelated code.
- Work in small, verifiable steps; run typecheck/lint/build after each major step.
- Report what you built, which screens it covers, decisions where the blueprint was silent, and any conflict noticed.
