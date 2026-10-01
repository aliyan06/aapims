# `src/data` — the fictional world

The data layer is a **single, typed, fictional dataset** that models one aviation authority
processing permits. It is static seed data with no backend and no network calls. The Zustand store
(`src/store`) clones this world into mutable state at startup and on every reset; on refresh the
original seed is used again.

Everything in this folder is **fictional**. Names, registrations, certificate numbers, references
and contact details are invented for the demo, and all email domains use the reserved `.example`
TLD (for example `permits@globalwings.example`, `permits@caa.gov.example`).

## Files

| File          | Responsibility                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------- |
| `types.ts`    | Domain types (`DemoWorld`, `ApplicationRecord`, `PermitRecord`, …) and the `STORY_IDS` constant.    |
| `seed.ts`     | The actual data: operators, aircraft, agents, documents, applications, permits, audit, RBAC, etc.   |
| `taxonomy.ts` | Static option lists used by forms and filters (permit kinds, flight categories, document statuses). |
| `lookups.ts`  | Pure lookup helpers (`getAircraft`, `getApplication`, `getPermit`, `operatorName`, …).              |
| `index.ts`    | Barrel exports plus `runDataValidation`, a dev referential-integrity check.                         |

## The demo date

The demo "today" is **10 October 2026**. `DEMO_NOW` is `2026-10-10T09:00:00.000Z` and the hero
operation date (`OPERATION_DATE`) is **15 October 2026**. Date literals in the seed are relative to
this fixed timeline; they are never derived at module scope from imported bindings.

## Id conventions

Every entity has a stable, prefixed id so it reads clearly in the demo and in the store inspector:

| Prefix  | Entity       | Example                 |
| ------- | ------------ | ----------------------- |
| `op-*`  | Operator     | `op-global-wings`       |
| `ac-*`  | Aircraft     | `ac-a6-gwa`             |
| `ag-*`  | Agent        | `ag-aviation-services`  |
| `doc-*` | Document     | `doc-gwa-aoc`           |
| `app-*` | Application  | `app-aap-2026-00125`    |
| `prm-*` | Permit       | `prm-caa-of-2026-00452` |
| `rev-*` | Revision     | `rev-001`               |
| `aud-*` | Audit entry  | `aud-001`               |
| `ntf-*` | Notification | `ntf-001`               |

Human-facing references follow their own patterns: applications use `AAP-2026-00125`, permits use
`CAA-OF-2026-00452`, and so on.

## Hero ids — `STORY_IDS`

`STORY_IDS` in `types.ts` locks the identifiers that the storyline depends on, so screens, scenes and
transitions reference them instead of repeating string literals:

| Key                    | Value                   |
| ---------------------- | ----------------------- |
| `operator`             | `op-global-wings`       |
| `agent`                | `ag-aviation-services`  |
| `aircraft`             | `ac-a6-gwa`             |
| `application`          | `app-aap-2026-00125`    |
| `applicationReference` | `AAP-2026-00125`        |
| `permit`               | `prm-caa-of-2026-00452` |
| `permitNumber`         | `CAA-OF-2026-00452`     |
| `revision`             | `rev-001`               |
| `reviewer`             | `Permit Reviewer`       |
| `financeOfficer`       | `Finance Officer`       |
| `approver`             | `Permit Approver`       |
| `operatorActor`        | `Operator Admin`        |

## Usage rule

Screens must **never import raw data constants** from `src/data`. Read state through `src/store`
selectors and mutate only through store actions. The only permitted direct imports from `src/data`
are:

- types (`import type { ApplicationRecord } from "@/data/types"`),
- `STORY_IDS`,
- `taxonomy` option lists.

This keeps one source of truth and lets the store-driven storyline stay consistent across portals.

## Validation

`runDataValidation(world)` is a dev-only referential-integrity check. It verifies that every
application points at a known aircraft, document and permit, and returns a list of human-readable
problems (empty when the world is consistent). The imported `WORLD` is also deep-frozen in
development by `src/store/initial-state.ts` so accidental mutation of the seed fails loudly.
