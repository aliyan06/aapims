/**
 * Shell roles and demo-only navigation metadata.
 * AAPIMS is a desktop web system: every role renders in the same browser frame.
 * These are UI/demo configuration, not domain data (that lives in src/data).
 */

import type { Role } from "@/data/types";

export type { Role };

export const ROLES: readonly Role[] = ["operator", "reviewer", "finance", "approver", "public"];

export const ROLE_LABEL: Record<Role, string> = {
  operator: "Operator",
  reviewer: "Permit Reviewer",
  finance: "Finance Officer",
  approver: "Permit Approver",
  public: "Public Verification",
};

export const ROLE_SHORT_LABEL: Record<Role, string> = {
  operator: "Operator",
  reviewer: "Reviewer",
  finance: "Finance",
  approver: "Approver",
  public: "Public",
};

/** AAPIMS is desktop-first; every role uses the desktop frame (one role, one surface). */
export const ROLE_SURFACE: Record<Role, "desktop"> = {
  operator: "desktop",
  reviewer: "desktop",
  finance: "desktop",
  approver: "desktop",
  public: "desktop",
};

/** Entry point for "Start the story" and the presenter reset. */
export const DEMO_START_ROUTE = "/login";

/** Role root routes the presenter switcher navigates to. */
export const ROLE_HOME = {
  operator: "/operator/dashboard",
  reviewer: "/authority/applications",
  finance: "/authority/finance",
  approver: "/authority/approval",
  public: "/verify",
} as const satisfies Record<Role, string>;

/** Demo URL shown in the desktop browser frame per role. */
export const ROLE_DESKTOP_URL: Record<Role, string> = {
  operator: "aapims.gov.demo/operator",
  reviewer: "aapims.gov.demo/authority/applications",
  finance: "aapims.gov.demo/authority/finance",
  approver: "aapims.gov.demo/authority/approval",
  public: "aapims.gov.demo/verify",
};

/** Which authority roles may act in the authority portal (permission model). */
export type AuthorityRole = "reviewer" | "finance" | "approver";

export function isAuthorityRole(role: Role): role is AuthorityRole {
  return role === "reviewer" || role === "finance" || role === "approver";
}

/** Demo login accounts, matching the credentials in the specification. */
export type DemoAccount = {
  role: Role;
  email: string;
  password: string;
  title: string;
  displayName: string;
};

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    role: "operator",
    email: "operator@demo.com",
    password: "demo123",
    title: "Operator Admin",
    displayName: "Global Wings Aviation",
  },
  {
    role: "reviewer",
    email: "reviewer@authority.gov",
    password: "demo123",
    title: "Permit Reviewer",
    displayName: "Civil Aviation Authority",
  },
  {
    role: "finance",
    email: "finance@authority.gov",
    password: "demo123",
    title: "Finance Officer",
    displayName: "Civil Aviation Authority",
  },
  {
    role: "approver",
    email: "approver@authority.gov",
    password: "demo123",
    title: "Permit Approver",
    displayName: "Civil Aviation Authority",
  },
];

export function accountForRole(role: Role): DemoAccount | undefined {
  return DEMO_ACCOUNTS.find((account) => account.role === role);
}
