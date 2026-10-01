import { useEffect } from "react";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { DeviceStage } from "@/components/shell/DeviceStage";
import { PermissionGate, type PermissionRule } from "@/components/shell/PermissionGate";
import { ROLE_DESKTOP_URL, isCustomerRole } from "@/components/shell/roles";
import { OperatorSidebar } from "@/components/operator/OperatorSidebar";
import type { Role } from "@/data/types";
import { useActiveRole, useAppStore } from "@/store";

export const Route = createFileRoute("/operator")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/operator" || location.pathname === "/operator/") {
      throw redirect({ to: "/operator/dashboard" });
    }
  },
  component: OperatorLayout,
});

/** Longest-prefix permission rules for the customer (operator) portal. */
const OPERATOR_RULES: PermissionRule[] = [
  { prefix: "/operator/applications", permission: "app.view" },
  { prefix: "/operator/apply", permission: "app.create" },
  { prefix: "/operator/aircraft", permission: "aircraft.manage" },
  { prefix: "/operator/documents", permission: "doc.manage" },
  { prefix: "/operator/agents", permission: "agent.manage" },
  { prefix: "/operator/payments", permission: "payment.manage" },
  { prefix: "/operator/permits", permission: "permit.view" },
  { prefix: "/operator/registration", permission: "org.profile.manage" },
  { prefix: "/operator/revision", permission: "permit.revise" },
];

function resolveCustomerRole(role: Role): Role {
  return isCustomerRole(role) ? role : "operatorAdmin";
}

function OperatorLayout() {
  const activeRole = useActiveRole();
  const setActiveRole = useAppStore((s) => s.setActiveRole);

  useEffect(() => {
    if (!isCustomerRole(activeRole)) {
      setActiveRole("operatorAdmin");
    }
  }, [activeRole, setActiveRole]);

  const role = resolveCustomerRole(activeRole);

  return (
    <DeviceStage role={role} url={ROLE_DESKTOP_URL[role]} sidebar={<OperatorSidebar />}>
      <PermissionGate rules={OPERATOR_RULES} resolveRole={resolveCustomerRole}>
        <Outlet />
      </PermissionGate>
    </DeviceStage>
  );
}
