# AAPIMS — Blueprint (source of truth)

Consolidates the client `lovable-prompt.md` and `features.md`. If a task conflicts with this file, stop and report.

## 1. Purpose

A desktop POC for the **Aviation Authority Permit Integrated Management System**, by Moavin Technologies, pitching a complete digital permit lifecycle to a government aviation authority. Not a product: mock data, no backend, resets on refresh. Quality and a flawless end-to-end story matter more than breadth.

## 2. Two portals + public verification

- **Operator Portal** — registration, aircraft, documents, agents, permit application, payment, tracking, permits, revision.
- **Authority Portal** — dashboard, applications, reviewer workspace, finance clearance, technical review, approval, issued permits, audit, search.
- **Public QR Verification** — no login; verify a permit by number or application reference.

**Roles (features.md §1).** Authority side: **Super Admin**, **Permit Reviewer**, **Permit Approver**, **Finance Officer**. Customer side: **Operator Admin**, **Permit Officer**, **Finance Officer**, **Viewer**. Each role lands on its own dashboard, sees only its permitted navigation, and can only perform its permitted actions (RBAC matrix in `src/lib/rbac.ts`, enforced by `PermissionGate`/`RequirePermission`). Login uses a mock email/password + MFA/OTP step; the presenter panel can switch role directly.

## 3. Reading order (how the story works)

Operator applies → documents → validation → finance clearance → authority review → technical review → approval → digital e-permit (QR) → public verification → revision/reissue → audit trail.

## 4. Permit lifecycle statuses

`DRAFT → SUBMITTED → UNDER REVIEW → AWAITING FINANCE → TECHNICAL REVIEW → AWAITING FINAL APPROVAL → APPROVED → ISSUED`, plus `REVISION REQUESTED → REISSUED` and `RETURNED`, `REJECTED`, `EXPIRED`, `REVOKED`, `ARCHIVED`.

Colours (from `src/lib/status.ts`): draft/archived grey; submitted/under review blue; awaiting tech/awaiting approval/warning amber; finance cleared/pass green; approved/issued emerald/teal; revision purple; rejected/expired/revoked red; returned orange.

## 5. Hero data (fictional)

- Operator **Global Wings Aviation**, `GWA-001`, UAE, `AOC-UAE-45821`.
- Aircraft **A6-GWA**, Boeing 737-800, MTOW 79,000 kg.
- Flight **GW452** / call sign GWA452, 142 pax.
- Route **Dubai (OMDB) → Nairobi (HKJK)**, entry `POINT-A`, exit `POINT-B`, 15 Oct 2026.
- Application **`AAP-2026-00125`**; permit **`CAA-OF-2026-00452`**.
- Fees: permit 500 + processing 50 = USD 550; wallet balance USD 2,000.
- Agent **Aviation Services Ltd.**, `AG-001`.
- Authority: **Civil Aviation Authority** (`CAA`).

## 6. Routes

| Path                                                                                                                                                                                                                                                                     | Layout          | Notes                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- | ------------------------------ |
| `/`                                                                                                                                                                                                                                                                      | none            | Launcher (HERO)                |
| `/login`                                                                                                                                                                                                                                                                 | none            | Mock login, role → dashboard   |
| `/operator`                                                                                                                                                                                                                                                              | `operator.tsx`  | Operator portal                |
| `/operator/dashboard`, `/profile`, `/aircraft`, `/aircraft/$aircraftId`, `/documents`, `/agents`, `/apply`, `/applications`, `/applications/$reference`, `/permits`, `/permits/$permitNumber`, `/payments`, `/registration`, `/notifications`, `/revision/$permitNumber` |                 |                                |
| `/authority`                                                                                                                                                                                                                                                             | `authority.tsx` | Authority portal               |
| `/authority/dashboard`, `/applications`, `/applications/$reference`, `/applications/$reference/technical`, `/finance`, `/finance/$reference`, `/approval`, `/approval/$reference`, `/permits`, `/permits/$permitNumber`, `/audit`, `/roles`, `/notifications`            |                 |                                |
| `/verify`                                                                                                                                                                                                                                                                | none            | Public verification            |
| `/notifications`                                                                                                                                                                                                                                                         | either          | Role-aware notification centre |

## 7. Screen inventory

**Operator:** dashboard (summary cards) · profile · aircraft list/detail · document centre (statuses + upload/replace mock) · agents (simple) · **permit application wizard** (Permit Type → Operator & Aircraft → Flight Category → Flight Details → Route & Schedule → Documents → Validation → Payment → Review & Submit) · submitted confirmation · My Applications + detail with lifecycle timeline · My Permits + **Digital E-Permit** (QR, signature, seal) · Payments/wallet · Revision request · Registration/KYC status · notifications.

**Authority:** dashboard (pipeline cards) · applications list/detail · **reviewer workspace** (sections + verification checklist + actions) · **finance clearance** · **technical review** · **permit approval** + issue · issued permits + permit detail · **audit trail** · roles & permissions matrix (light) · notifications.

**Public:** verification page.

## 8. Theme

Navy `#0B2545` + aviation blue `#1C6FBF`, white/light-grey `#F5F7FA`, Moavin blue `#2D7DE0` as a small brand tie-in, gold `#B8860B` reserved for the permit seal. Font: **Inter**. Tokens only; no raw hex in components.

## 9. Presenter

The presenter panel switches the active role (Operator, Permit Reviewer, Finance Officer, Permit Approver, Public) and resets the demo. The full lifecycle is driven live through the portal screens: apply → review → finance → technical → approve → issue → verify → revise → reissue → audit. (`src/store/scenes.ts` retains deterministic presets for tests only; the presenter UI does not list scenes.)

## 10. Out of scope (do not build)

Analytics dashboards, revenue/country analytics, reporting centre, refunds/credit notes, NOTAM, AI chatbot, live integrations, WYSIWYG template builders, mobile/tablet optimisation, advanced notification builder, complex admin.
