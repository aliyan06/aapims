import { describe, expect, it } from "vitest";
import type { Role } from "@/data/types";
import { ROLE_PERMISSIONS, isAuthorityRole, isCustomerRole, roleHasPermission } from "./rbac";

const ALL_ROLES: Role[] = [
  "superadmin",
  "reviewer",
  "approver",
  "finance",
  "operatorAdmin",
  "permitOfficer",
  "operatorFinance",
  "viewer",
  "public",
];

describe("RBAC matrix (features.md §1, §20)", () => {
  it("grants the reviewer review rights but not finance or approval", () => {
    expect(roleHasPermission("reviewer", "app.review")).toBe(true);
    expect(roleHasPermission("reviewer", "app.recommend")).toBe(true);
    expect(roleHasPermission("reviewer", "finance.verify")).toBe(false);
    expect(roleHasPermission("reviewer", "permit.approve")).toBe(false);
  });

  it("grants finance only financial actions", () => {
    expect(roleHasPermission("finance", "finance.verify")).toBe(true);
    expect(roleHasPermission("finance", "finance.hold")).toBe(true);
    expect(roleHasPermission("finance", "permit.approve")).toBe(false);
    expect(roleHasPermission("finance", "app.review")).toBe(false);
  });

  it("grants the approver approval and issuance only", () => {
    expect(roleHasPermission("approver", "permit.approve")).toBe(true);
    expect(roleHasPermission("approver", "permit.issue")).toBe(true);
    expect(roleHasPermission("approver", "finance.hold")).toBe(false);
    expect(roleHasPermission("approver", "app.create")).toBe(false);
  });

  it("separates customer roles", () => {
    expect(roleHasPermission("operatorAdmin", "app.create")).toBe(true);
    expect(roleHasPermission("operatorAdmin", "payment.manage")).toBe(true);
    expect(roleHasPermission("permitOfficer", "app.create")).toBe(true);
    expect(roleHasPermission("permitOfficer", "payment.manage")).toBe(false);
    expect(roleHasPermission("operatorFinance", "payment.manage")).toBe(true);
    expect(roleHasPermission("operatorFinance", "app.create")).toBe(false);
    expect(roleHasPermission("viewer", "app.view")).toBe(true);
    expect(roleHasPermission("viewer", "app.create")).toBe(false);
    expect(roleHasPermission("viewer", "permit.revise")).toBe(false);
  });

  it("gives the super admin every permission", () => {
    expect(ROLE_PERMISSIONS.superadmin.length).toBeGreaterThan(ROLE_PERMISSIONS.approver.length);
    for (const role of ALL_ROLES) {
      if (role === "superadmin") continue;
      for (const permission of ROLE_PERMISSIONS[role]) {
        expect(roleHasPermission("superadmin", permission)).toBe(true);
      }
    }
  });

  it("classifies authority and customer sides", () => {
    expect(isAuthorityRole("reviewer")).toBe(true);
    expect(isAuthorityRole("superadmin")).toBe(true);
    expect(isAuthorityRole("viewer")).toBe(false);
    expect(isCustomerRole("operatorAdmin")).toBe(true);
    expect(isCustomerRole("permitOfficer")).toBe(true);
    expect(isCustomerRole("reviewer")).toBe(false);
  });
});
