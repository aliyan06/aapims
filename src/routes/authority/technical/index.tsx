import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ApplicationStatusBadge,
  DataTable,
  PortalPage,
  SectionCard,
  type Column,
} from "@/components/desktop";
import { operatorName } from "@/data";
import type { ApplicationRecord } from "@/data/types";
import { formatDate, useApplications, useWorld } from "@/store";

export const Route = createFileRoute("/authority/technical/")({
  component: TechnicalQueue,
});

function TechnicalQueue() {
  const navigate = useNavigate();
  const world = useWorld();
  const applications = useApplications();

  const queue = [...applications]
    .filter((application) => application.status === "TECHNICAL REVIEW")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const columns: Column<ApplicationRecord>[] = [
    {
      key: "reference",
      header: "Reference",
      cell: (application) => (
        <Link
          to="/authority/applications/$reference/technical"
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
      cell: (application) =>
        world.aircraft.find((item) => item.id === application.aircraftId)?.registration ?? "—",
    },
    {
      key: "route",
      header: "Route",
      cell: (application) =>
        `${application.route.originIcao} → ${application.route.destinationIcao}`,
    },
    {
      key: "entry",
      header: "Entry / Exit",
      cell: (application) => `${application.route.entryPoint} / ${application.route.exitPoint}`,
    },
    {
      key: "departure",
      header: "Departure",
      cell: (application) => formatDate(application.route.departureAt),
    },
    {
      key: "status",
      header: "Status",
      cell: (application) => <ApplicationStatusBadge status={application.status} />,
    },
    {
      key: "action",
      header: "",
      align: "right",
      cell: (application) => (
        <button
          type="button"
          className="rounded-md border border-border-strong px-3 py-1.5 text-[12px] font-semibold text-text-dark transition-colors hover:bg-surface-muted"
          onClick={(event) => {
            event.stopPropagation();
            navigate({
              to: "/authority/applications/$reference/technical",
              params: { reference: application.reference },
            });
          }}
        >
          Review
        </button>
      ),
    },
  ];

  return (
    <PortalPage
      title="Technical Review"
      description="Applications that have cleared finance and await route and airframe verification."
      breadcrumb={[{ label: "Authority" }, { label: "Technical Review" }]}
    >
      <SectionCard
        title="Technical queue"
        description={`${queue.length} application${queue.length === 1 ? "" : "s"} awaiting technical review.`}
        padded={false}
      >
        <DataTable
          columns={columns}
          rows={queue}
          getRowKey={(application) => application.id}
          onRowClick={(application) =>
            navigate({
              to: "/authority/applications/$reference/technical",
              params: { reference: application.reference },
            })
          }
          emptyTitle="No applications in technical review"
          emptyDescription="Applications appear here once finance has cleared them."
        />
      </SectionCard>
    </PortalPage>
  );
}
