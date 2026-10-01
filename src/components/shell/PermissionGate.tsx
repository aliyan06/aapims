import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { roleHasPermission, type PermissionKey } from "@/lib/rbac";
import { useActiveRole } from "@/store";
import { NotPermitted } from "./RequirePermission";

export type PermissionRule = {
  /** Path prefix this rule guards. */
  prefix: string;
  permission: PermissionKey;
};

/**
 * Central route guard for a portal. Matches the current pathname against the
 * longest rule prefix and renders a "not permitted" state when the active role
 * lacks the permission (features.md §20, permission-based actions / role-based
 * UI visibility).
 */
export function PermissionGate({
  rules,
  resolveRole,
  children,
}: {
  rules: PermissionRule[];
  /** Maps the active role to a portal role for permission checks. */
  resolveRole: (role: ReturnType<typeof useActiveRole>) => ReturnType<typeof useActiveRole>;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const activeRole = useActiveRole();
  const role = resolveRole(activeRole);

  const match = rules
    .filter((rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];

  if (match && !roleHasPermission(role, match.permission)) {
    return <NotPermitted />;
  }

  return <>{children}</>;
}
