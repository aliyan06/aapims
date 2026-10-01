import { useEffect } from "react";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { DeviceStage } from "@/components/shell/DeviceStage";
import { ROLE_DESKTOP_URL } from "@/components/shell/roles";
import { OperatorSidebar } from "@/components/operator/OperatorSidebar";
import { useAppStore } from "@/store";

export const Route = createFileRoute("/operator")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/operator" || location.pathname === "/operator/") {
      throw redirect({ to: "/operator/dashboard" });
    }
  },
  component: OperatorLayout,
});

function OperatorLayout() {
  const setActiveRole = useAppStore((s) => s.setActiveRole);

  useEffect(() => {
    setActiveRole("operator");
  }, [setActiveRole]);

  return (
    <DeviceStage role="operator" url={ROLE_DESKTOP_URL.operator} sidebar={<OperatorSidebar />}>
      <Outlet />
    </DeviceStage>
  );
}
