import { createFileRoute } from "@tanstack/react-router";
import { OperatorAdminDashboard } from "@/components/operator/dashboards/OperatorAdminDashboard";
import { OperatorFinanceDashboard } from "@/components/operator/dashboards/OperatorFinanceDashboard";
import { PermitOfficerDashboard } from "@/components/operator/dashboards/PermitOfficerDashboard";
import { ViewerDashboard } from "@/components/operator/dashboards/ViewerDashboard";
import { useActiveRole } from "@/store";

// Operator dashboard (different dashboard by role, prompt §24)
export const Route = createFileRoute("/operator/dashboard")({
  component: OperatorDashboard,
});

function OperatorDashboard() {
  const role = useActiveRole();
  switch (role) {
    case "permitOfficer":
      return <PermitOfficerDashboard />;
    case "operatorFinance":
      return <OperatorFinanceDashboard />;
    case "viewer":
      return <ViewerDashboard />;
    default:
      return <OperatorAdminDashboard />;
  }
}
