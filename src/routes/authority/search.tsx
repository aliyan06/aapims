import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import {
  ApplicationStatusBadge,
  DataTable,
  PortalPage,
  SectionCard,
  StatusBadge,
  type Column,
} from "@/components/desktop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAircraft, getAgent, operatorName } from "@/data/lookups";
import type { ApplicationRecord, PermitRecord } from "@/data/types";
import { formatDate, useWorld } from "@/store";
import type { StatusTone } from "@/lib/status";

export const Route = createFileRoute("/authority/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  component: AuthoritySearch,
});

const PERMIT_STATUS_TONE: Record<PermitRecord["status"], StatusTone> = {
  ISSUED: "issued",
  ACTIVE: "issued",
  REISSUED: "issued",
  EXPIRED: "expired",
  REVOKED: "rejected",
};

function includesQuery(value: string | null | undefined, query: string): boolean {
  return typeof value === "string" && value.toLowerCase().includes(query);
}

function AuthoritySearch() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const world = useWorld();

  const initial = (search.q ?? "").trim();
  const [term, setTerm] = useState(initial);
  const [submitted, setSubmitted] = useState(initial);

  useEffect(() => {
    const next = (search.q ?? "").trim();
    if (next) {
      setTerm(next);
      setSubmitted(next);
    }
  }, [search.q]);

  const query = submitted.toLowerCase();
  const hasQuery = query.length > 0;

  const applications = useMemo(() => {
    if (!hasQuery) return [];
    return world.applications.filter((application) => {
      const agentName = getAgent(world, application.agentId)?.name ?? "";
      return [
        application.reference,
        operatorName(world, application.operatorId),
        getAircraft(world, application.aircraftId).registration,
        application.flight.flightNumber,
        application.flight.callSign,
        agentName,
      ].some((value) => includesQuery(value, query));
    });
  }, [world, query, hasQuery]);

  const permits = useMemo(() => {
    if (!hasQuery) return [];
    return world.permits.filter((permit) =>
      [
        permit.permitNumber,
        permit.flightNumber,
        permit.routeLabel,
        operatorName(world, permit.operatorId),
        getAircraft(world, permit.aircraftId).registration,
      ].some((value) => includesQuery(value, query)),
    );
  }, [world, query, hasQuery]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = term.trim();
    setSubmitted(next);
    navigate({ to: "/authority/search", search: { q: next || undefined }, replace: true });
  }

  const applicationColumns: Column<ApplicationRecord>[] = [
    {
      key: "reference",
      header: "Reference",
      cell: (application) => (
        <span className="font-semibold text-accent">{application.reference}</span>
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
    { key: "flight", header: "Flight", cell: (application) => application.flight.flightNumber },
    {
      key: "route",
      header: "Route",
      cell: (application) =>
        `${application.route.originIcao} → ${application.route.destinationIcao}`,
    },
    {
      key: "status",
      header: "Status",
      cell: (application) => <ApplicationStatusBadge status={application.status} />,
    },
  ];

  const permitColumns: Column<PermitRecord>[] = [
    {
      key: "permitNumber",
      header: "Permit Number",
      cell: (permit) => <span className="font-semibold text-text-dark">{permit.permitNumber}</span>,
    },
    {
      key: "operator",
      header: "Operator",
      cell: (permit) => operatorName(world, permit.operatorId),
    },
    {
      key: "aircraft",
      header: "Aircraft",
      cell: (permit) => getAircraft(world, permit.aircraftId).registration,
    },
    { key: "flight", header: "Flight", cell: (permit) => permit.flightNumber },
    { key: "validUntil", header: "Valid Until", cell: (permit) => formatDate(permit.validUntil) },
    {
      key: "status",
      header: "Status",
      cell: (permit) => (
        <StatusBadge label={permit.status} tone={PERMIT_STATUS_TONE[permit.status]} />
      ),
    },
  ];

  const applicationEmpty = hasQuery
    ? {
        emptyTitle: "No applications matched",
        emptyDescription: `Nothing matched “${submitted}”. Try a permit number, reference, operator, agent, registration, flight or call sign.`,
      }
    : {
        emptyTitle: "Start your search",
        emptyDescription:
          "Search across every application by permit number, application reference, operator, agent, aircraft registration, flight number or call sign.",
      };

  const permitEmpty = hasQuery
    ? {
        emptyTitle: "No permits matched",
        emptyDescription: `Nothing matched “${submitted}”. Try a permit number, flight number, route, operator or aircraft registration.`,
      }
    : {
        emptyTitle: "Start your search",
        emptyDescription:
          "Search issued permits by permit number, flight number, route, operator or aircraft registration.",
      };

  return (
    <PortalPage
      title="Search"
      description="Find any application or issued permit across the authority portal from a single query."
      breadcrumb={[{ label: "Authority" }, { label: "Search" }]}
    >
      <div className="space-y-5">
        <SectionCard>
          <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block flex-1">
              <span className="mb-1.5 block text-[12px] font-semibold text-text-dark">
                Search term
              </span>
              <Input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="AAP-2026-00125, CAA-OF-2026-00452, A6-GWA, GW452, GWA452…"
                className="h-10"
                autoFocus
              />
            </label>
            <Button type="submit" size="lg" className="gap-2">
              <Search size={16} />
              Search
            </Button>
          </form>
        </SectionCard>

        <SectionCard
          title="Applications"
          description={
            hasQuery
              ? `${applications.length} application${applications.length === 1 ? "" : "s"} matched.`
              : "Application records matching your search."
          }
          padded={false}
        >
          <DataTable
            columns={applicationColumns}
            rows={applications}
            getRowKey={(application) => application.id}
            onRowClick={(application) =>
              navigate({
                to: "/authority/applications/$reference",
                params: { reference: application.reference },
              })
            }
            emptyTitle={applicationEmpty.emptyTitle}
            emptyDescription={applicationEmpty.emptyDescription}
          />
        </SectionCard>

        <SectionCard
          title="Permits"
          description={
            hasQuery
              ? `${permits.length} permit${permits.length === 1 ? "" : "s"} matched.`
              : "Issued permits matching your search."
          }
          padded={false}
        >
          <DataTable
            columns={permitColumns}
            rows={permits}
            getRowKey={(permit) => permit.id}
            onRowClick={(permit) =>
              navigate({
                to: "/authority/permits/$permitNumber",
                params: { permitNumber: permit.permitNumber },
              })
            }
            emptyTitle={permitEmpty.emptyTitle}
            emptyDescription={permitEmpty.emptyDescription}
          />
        </SectionCard>
      </div>
    </PortalPage>
  );
}
