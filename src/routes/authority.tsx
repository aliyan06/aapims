import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { DeviceStage } from "@/components/shell/DeviceStage";
import { PermissionGate, type PermissionRule } from "@/components/shell/PermissionGate";
import { ROLE_DESKTOP_URL, isAuthorityRole } from "@/components/shell/roles";
import { AuthoritySidebar } from "@/components/authority/AuthoritySidebar";
import type { Role } from "@/data/types";
import { useActiveRole, useAppStore } from "@/store";

export const Route = createFileRoute("/authority")({
  beforeLoad: ({ location }) => {
    const store = useAppStore.getState();
    if (!store.meta.signedIn) {
      throw redirect({ to: "/login" });
    }
    if (location.pathname === "/authority" || location.pathname === "/authority/") {
      throw redirect({ to: "/authority/dashboard" });
    }
    // Default the role only when entering the portal, never on later switches.
    if (!isAuthorityRole(store.meta.activeRole)) {
      store.setActiveRole("reviewer");
    }
  },
  component: AuthorityLayout,
});

/** Longest-prefix permission rules for the authority portal. */
const AUTHORITY_RULES: PermissionRule[] = [
  { prefix: "/authority/applications", permission: "app.view" },
  { prefix: "/authority/technical", permission: "tech.review" },
  { prefix: "/authority/finance", permission: "finance.verify" },
  { prefix: "/authority/approval", permission: "permit.approve" },
  { prefix: "/authority/permits", permission: "permit.view" },
  { prefix: "/authority/review", permission: "app.review" },
  { prefix: "/authority/audit", permission: "audit.view" },
  { prefix: "/authority/roles", permission: "roles.manage" },
  { prefix: "/authority/search", permission: "app.view" },
];

function resolveAuthorityRole(role: Role): Role {
  return isAuthorityRole(role) ? role : "reviewer";
}

function AuthorityLayout() {
  const activeRole = useActiveRole();
  const role = resolveAuthorityRole(activeRole);

  return (
    <DeviceStage role={role} url={ROLE_DESKTOP_URL[role]} sidebar={<AuthoritySidebar />}>
      <PermissionGate rules={AUTHORITY_RULES} resolveRole={resolveAuthorityRole}>
        <Outlet />
      </PermissionGate>
    </DeviceStage>
  );
}
