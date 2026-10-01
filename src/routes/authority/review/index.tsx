import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ApplicationStatusBadge,
  DataTable,
  EmptyState,
  PortalPage,
  SectionCard,
  type Column,
} from "@/components/desktop";
import { getAircraft, operatorName } from "@/data";
import type { ApplicationRecord, ApplicationStatus } from "@/data/types";
import { formatDate, useApplications, useWorld } from "@/store";

export const Route = createFileRoute("/authority/review/")({
  component: PermitReviewQueue,
});

const REVIEW_STATUSES: readonly ApplicationStatus[] = [
  "SUBMITTED",
  "UNDER REVIEW",
  "TECHNICAL REVIEW",
];

function PermitReviewQueue() {
  const navigate = useNavigate();
  const world = useWorld();
  const applications = useApplications();

  const queue = [...applications]
    .filter((application) => REVIEW_STATUSES.includes(application.status))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const openApplication = (application: ApplicationRecord) => {
    if (application.status === "TECHNICAL REVIEW") {
      navigate({
        to: "/authority/applications/$reference/technical",
        params: { reference: application.reference },
      });
      return;
    }
    navigate({
      to: "/authority/applications/$reference",
      params: { reference: application.reference },
    });
  };

  const columns: Column<ApplicationRecord>[] = [
    {
      key: "reference",
      header: "Reference",
      cell: (application) => (
        <Link
          to="/authority/applications/$reference"
          params={{ reference: application.reference }}
          className="font-semibold text-accent hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          {application.reference}
        </Link>
      ),
    },
    {
      key: "operator",
      header: "Operator",
      cell: (application) => operatorName(world, application.operatorId),
    },
    {
      key: "aircraft",
      header: "Aircraft",
      cell: (application) => getAircraft(world, application.aircraftId).registration,
    },
    {
      key: "flight",
      header: "Flight",
      cell: (application) => application.flight.flightNumber,
    },
    {
      key: "route",
      header: "Route",
      cell: (application) =>
        `${application.route.originIcao} → ${application.route.destinationIcao}`,
    },
    {
      key: "submitted",
      header: "Submitted",
      cell: (application) => (application.submittedAt ? formatDate(application.submittedAt) : "—"),
    },
    {
      key: "status",
      header: "Status",
      cell: (application) => <ApplicationStatusBadge status={application.status} />,
    },
  ];

  return (
    <PortalPage
      title="Permit Review"
      description="Applications awaiting permit review and technical action."
      breadcrumb={[{ label: "Authority" }, { label: "Permit Review" }]}
    >
      <SectionCard
        title="Review queue"
        description={`${queue.length} application${queue.length === 1 ? "" : "s"} awaiting review.`}
        padded={false}
      >
        {queue.length === 0 ? (
          <EmptyState
            title="No applications awaiting review"
            description="Submitted and in-review applications will appear here as they arrive."
          />
        ) : (
          <DataTable
            columns={columns}
            rows={queue}
            getRowKey={(application) => application.id}
            onRowClick={openApplication}
          />
        )}
      </SectionCard>
    </PortalPage>
  );
}
