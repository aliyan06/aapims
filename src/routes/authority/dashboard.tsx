import { createFileRoute } from "@tanstack/react-router";
import { ApproverDashboard } from "@/components/authority/dashboards/ApproverDashboard";
import { FinanceDashboard } from "@/components/authority/dashboards/FinanceDashboard";
import { ReviewerDashboard } from "@/components/authority/dashboards/ReviewerDashboard";
import { SuperAdminDashboard } from "@/components/authority/dashboards/SuperAdminDashboard";
import { useActiveRole } from "@/store";

// O1 - Authority dashboard (different dashboard by role, features.md §1 / prompt §24)
export const Route = createFileRoute("/authority/dashboard")({
  component: AuthorityDashboard,
});

function AuthorityDashboard() {
  const role = useActiveRole();
  switch (role) {
    case "finance":
      return <FinanceDashboard />;
    case "approver":
      return <ApproverDashboard />;
    case "superadmin":
      return <SuperAdminDashboard />;
    default:
      return <ReviewerDashboard />;
  }
}
