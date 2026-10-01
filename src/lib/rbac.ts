import type { Role } from "@/data/types";

/**
 * Permission catalogue and the RBAC matrix (features.md §1, §20).
 * The matrix is the single source of truth for role-based UI visibility.
 */
export type PermissionKey =
  | "app.create"
  | "app.submit"
  | "app.view"
  | "app.review"
  | "app.recommend"
  | "app.return"
  | "app.requestInfo"
  | "doc.manage"
  | "doc.verify"
  | "tech.review"
  | "finance.verify"
  | "finance.hold"
  | "payment.manage"
  | "aircraft.manage"
  | "agent.manage"
  | "org.profile.manage"
  | "permit.view"
  | "permit.approve"
  | "permit.issue"
  | "permit.revise"
  | "permit.revise.approve"
  | "audit.view"
  | "user.manage"
  | "roles.manage"
  | "verify.public";

export const PERMISSION_LABEL: Record<PermissionKey, string> = {
  "app.create": "Create application",
  "app.submit": "Submit application",
  "app.view": "View applications",
  "app.review": "Review application",
  "app.recommend": "Recommend approval",
  "app.return": "Return / request information",
  "app.requestInfo": "Request information",
  "doc.manage": "Upload / replace documents",
  "doc.verify": "Verify documents",
  "tech.review": "Perform technical review",
  "finance.verify": "Verify payment",
  "finance.hold": "Place / clear financial hold",
  "payment.manage": "Manage payments and wallet",
  "aircraft.manage": "Manage aircraft",
  "agent.manage": "Manage agents and authorizations",
  "org.profile.manage": "Manage operator profile and KYC",
  "permit.view": "View permits",
  "permit.approve": "Approve permit",
  "permit.issue": "Issue digital permit",
  "permit.revise": "Request permit revision",
  "permit.revise.approve": "Approve permit revision",
  "audit.view": "View audit trail",
  "user.manage": "Manage users",
  "roles.manage": "Manage roles and permissions",
  "verify.public": "Public permit verification",
};

const ALL_PERMISSIONS = Object.keys(PERMISSION_LABEL) as PermissionKey[];

export const ROLE_PERMISSIONS: Record<Role, readonly PermissionKey[]> = {
  superadmin: ALL_PERMISSIONS,
  reviewer: [
    "app.view",
    "app.review",
    "app.recommend",
    "app.return",
    "app.requestInfo",
    "doc.verify",
    "tech.review",
    "permit.view",
    "audit.view",
  ],
  finance: ["app.view", "finance.verify", "finance.hold", "permit.view", "audit.view"],
  approver: [
    "app.view",
    "permit.view",
    "permit.approve",
    "permit.issue",
    "permit.revise.approve",
    "audit.view",
  ],
  operatorAdmin: [
    "app.create",
    "app.submit",
    "app.view",
    "doc.manage",
    "aircraft.manage",
    "agent.manage",
    "payment.manage",
    "org.profile.manage",
    "permit.view",
    "permit.revise",
    "user.manage",
  ],
  permitOfficer: [
    "app.create",
    "app.submit",
    "app.view",
    "doc.manage",
    "permit.view",
    "permit.revise",
  ],
  operatorFinance: ["app.view", "payment.manage", "permit.view"],
  viewer: ["app.view", "permit.view"],
  public: ["verify.public"],
};

export function roleHasPermission(role: Role, permission: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function isAuthorityRole(role: Role): boolean {
  return role === "superadmin" || role === "reviewer" || role === "approver" || role === "finance";
}

export function isCustomerRole(role: Role): boolean {
  return (
    role === "operatorAdmin" ||
    role === "permitOfficer" ||
    role === "operatorFinance" ||
    role === "viewer"
  );
}
