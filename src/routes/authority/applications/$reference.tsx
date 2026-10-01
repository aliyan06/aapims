import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { FileWarning } from "lucide-react";
import { ApplicationStatusBadge, EmptyState, PortalPage } from "@/components/desktop";
import { Button } from "@/components/ui/button";
import { operatorName } from "@/data";
import { useApplication, useWorld } from "@/store";

export const Route = createFileRoute("/authority/applications/$reference")({
  component: ApplicationLayout,
});

function ApplicationLayout() {
  const { reference } = Route.useParams();
  const navigate = useNavigate();
  const world = useWorld();
  const application = useApplication(reference);

  if (!application) {
    return (
      <PortalPage
        title="Application not found"
        breadcrumb={[
          { label: "Authority" },
          { label: "Applications", to: "/authority/applications" },
        ]}
      >
        <EmptyState
          icon={FileWarning}
          title="Unknown application reference"
          description={`No application matches ${reference}.`}
          action={
            <Button onClick={() => navigate({ to: "/authority/applications" })}>
              Back to applications
            </Button>
          }
        />
      </PortalPage>
    );
  }

  return (
    <PortalPage
      title={application.reference}
      description={`${operatorName(world, application.operatorId)} · ${application.permitKind} · Assigned to ${application.assignedReviewer}`}
      breadcrumb={[
        { label: "Authority" },
        { label: "Applications", to: "/authority/applications" },
        { label: application.reference },
      ]}
      actions={<ApplicationStatusBadge status={application.status} />}
    >
      <Outlet />
    </PortalPage>
  );
}
