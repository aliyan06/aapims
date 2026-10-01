import { useEffect } from "react";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { DeviceStage } from "@/components/shell/DeviceStage";
import { ROLE_DESKTOP_URL, isAuthorityRole } from "@/components/shell/roles";
import { AuthoritySidebar } from "@/components/authority/AuthoritySidebar";
import { useActiveRole, useAppStore } from "@/store";

export const Route = createFileRoute("/authority")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/authority" || location.pathname === "/authority/") {
      throw redirect({ to: "/authority/dashboard" });
    }
  },
  component: AuthorityLayout,
});

function AuthorityLayout() {
  const activeRole = useActiveRole();
  const setActiveRole = useAppStore((s) => s.setActiveRole);

  // Authority surfaces are desktop-only. Fall back to the reviewer role when a
  // non-authority role (e.g. operator) lands here; done in an effect so the
  // server render never mutates the shared store.
  useEffect(() => {
    if (!isAuthorityRole(activeRole)) {
      setActiveRole("reviewer");
    }
  }, [activeRole, setActiveRole]);

  const role = isAuthorityRole(activeRole) ? activeRole : "reviewer";

  return (
    <DeviceStage role={role} url={ROLE_DESKTOP_URL[role]} sidebar={<AuthoritySidebar />}>
      <Outlet />
    </DeviceStage>
  );
}
