import type { Role } from "@/data/types";
import { isAuthorityRole, isCustomerRole } from "@/lib/rbac";

export type { Role };
export { isAuthorityRole, isCustomerRole };

/**
 * All login roles (authority + customer) plus the public verification surface.
 * AAPIMS is desktop-only: every role renders in the same browser frame.
 */
export const ROLES: readonly Role[] = [
  "operatorAdmin",
  "permitOfficer",
  "operatorFinance",
  "viewer",
  "reviewer",
  "approver",
  "finance",
  "superadmin",
  "public",
];

/** Roles grouped exactly as the specification lists them (features.md §1). */
export const AUTHORITY_ROLES: readonly Role[] = ["superadmin", "reviewer", "approver", "finance"];

export const CUSTOMER_ROLES: readonly Role[] = [
  "operatorAdmin",
  "permitOfficer",
  "operatorFinance",
  "viewer",
];

export const PUBLIC_ROLES: readonly Role[] = ["public"];

export const ROLE_LABEL: Record<Role, string> = {
  operatorAdmin: "Operator Admin",
  permitOfficer: "Permit Officer",
  operatorFinance: "Operator Finance",
  viewer: "Viewer",
  reviewer: "Permit Reviewer",
  approver: "Permit Approver",
  finance: "Finance Officer",
  superadmin: "Super Admin",
  public: "Public Verification",
};

export const ROLE_SHORT_LABEL: Record<Role, string> = {
  operatorAdmin: "Operator",
  permitOfficer: "Permit",
  operatorFinance: "Finance",
  viewer: "Viewer",
  reviewer: "Reviewer",
  approver: "Approver",
  finance: "Finance",
  superadmin: "Admin",
  public: "Public",
};

/** AAPIMS is desktop-first; every role uses the desktop frame (one role, one surface). */
export const ROLE_SURFACE: Record<Role, "desktop"> = {
  operatorAdmin: "desktop",
  permitOfficer: "desktop",
  operatorFinance: "desktop",
  viewer: "desktop",
  reviewer: "desktop",
  approver: "desktop",
  finance: "desktop",
  superadmin: "desktop",
  public: "desktop",
};

/** Entry point for "Start the story" and the presenter reset. */
export const DEMO_START_ROUTE = "/login";

/** Role root routes: each role lands on its own dashboard (features.md §1, prompt §24). */
export const ROLE_HOME = {
  operatorAdmin: "/operator/dashboard",
  permitOfficer: "/operator/dashboard",
  operatorFinance: "/operator/dashboard",
  viewer: "/operator/dashboard",
  reviewer: "/authority/dashboard",
  approver: "/authority/dashboard",
  finance: "/authority/dashboard",
  superadmin: "/authority/dashboard",
  public: "/verify",
} as const satisfies Record<Role, string>;

/** Demo URL shown in the desktop browser frame per role. */
export const ROLE_DESKTOP_URL: Record<Role, string> = {
  operatorAdmin: "aapims.gov.demo/operator",
  permitOfficer: "aapims.gov.demo/operator",
  operatorFinance: "aapims.gov.demo/operator",
  viewer: "aapims.gov.demo/operator",
  reviewer: "aapims.gov.demo/authority",
  approver: "aapims.gov.demo/authority",
  finance: "aapims.gov.demo/authority",
  superadmin: "aapims.gov.demo/authority",
  public: "aapims.gov.demo/verify",
};

export type DemoAccount = {
  role: Role;
  email: string;
  password: string;
  title: string;
  displayName: string;
  side: "Authority Side" | "Customer Side";
};

/** Demo login accounts, matching the credentials in the specification. */
export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    role: "operatorAdmin",
    email: "operator@demo.com",
    password: "demo123",
    title: "Operator Admin",
    displayName: "Global Wings Aviation",
    side: "Customer Side",
  },
  {
    role: "permitOfficer",
    email: "permitofficer@demo.com",
    password: "demo123",
    title: "Permit Officer",
    displayName: "Global Wings Aviation",
    side: "Customer Side",
  },
  {
    role: "operatorFinance",
    email: "operatorfinance@demo.com",
    password: "demo123",
    title: "Finance Officer",
    displayName: "Global Wings Aviation",
    side: "Customer Side",
  },
  {
    role: "viewer",
    email: "viewer@demo.com",
    password: "demo123",
    title: "Viewer",
    displayName: "Global Wings Aviation",
    side: "Customer Side",
  },
  {
    role: "reviewer",
    email: "reviewer@authority.gov",
    password: "demo123",
    title: "Permit Reviewer",
    displayName: "Civil Aviation Authority",
    side: "Authority Side",
  },
  {
    role: "finance",
    email: "finance@authority.gov",
    password: "demo123",
    title: "Finance Officer",
    displayName: "Civil Aviation Authority",
    side: "Authority Side",
  },
  {
    role: "approver",
    email: "approver@authority.gov",
    password: "demo123",
    title: "Permit Approver",
    displayName: "Civil Aviation Authority",
    side: "Authority Side",
  },
  {
    role: "superadmin",
    email: "superadmin@authority.gov",
    password: "demo123",
    title: "Super Admin",
    displayName: "Civil Aviation Authority",
    side: "Authority Side",
  },
];

export function accountForRole(role: Role): DemoAccount | undefined {
  return DEMO_ACCOUNTS.find((account) => account.role === role);
}
