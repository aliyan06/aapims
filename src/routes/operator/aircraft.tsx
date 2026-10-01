import { useState } from "react";
import { Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { Plane, Plus } from "lucide-react";
import {
  DataTable,
  DocumentStatusBadge,
  Drawer,
  Field,
  PortalPage,
  SectionCard,
  type Column,
} from "@/components/desktop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AircraftRecord } from "@/data/types";
import { useAircraft, useAppStore, useOperator } from "@/store";

export const Route = createFileRoute("/operator/aircraft")({
  component: AircraftRoute,
});

/** The aircraft file doubles as the layout parent for the detail route. */
function AircraftRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname.startsWith("/operator/aircraft/")) {
    return <Outlet />;
  }
  return <AircraftList />;
}

function formatWeight(value: number): string {
  return `${new Intl.NumberFormat("en-US").format(value)} kg`;
}

function AircraftList() {
  const navigate = useNavigate();
  const operator = useOperator();
  const aircraft = useAircraft();
  const pushToast = useAppStore((s) => s.pushToast);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [registration, setRegistration] = useState("");
  const [type, setType] = useState("");

  const rows = aircraft.filter((item) => item.operatorId === operator.id);

  const columns: Column<AircraftRecord>[] = [
    {
      key: "registration",
      header: "Registration",
      cell: (item) => <span className="font-bold text-text-dark">{item.registration}</span>,
    },
    { key: "type", header: "Type", cell: (item) => item.type },
    {
      key: "mtow",
      header: "MTOW",
      align: "right",
      cell: (item) => formatWeight(item.mtowKg),
    },
    {
      key: "registrationCert",
      header: "Registration",
      cell: (item) => <DocumentStatusBadge status={item.certificates.registration.status} />,
    },
    {
      key: "airworthiness",
      header: "Airworthiness",
      cell: (item) => <DocumentStatusBadge status={item.certificates.airworthiness.status} />,
    },
    {
      key: "insurance",
      header: "Insurance",
      cell: (item) => <DocumentStatusBadge status={item.certificates.insurance.status} />,
    },
    {
      key: "noise",
      header: "Noise",
      cell: (item) => <DocumentStatusBadge status={item.certificates.noise.status} />,
    },
  ];

  function submitMockAircraft() {
    pushToast({
      title: "Aircraft submitted for verification",
      description: registration
        ? `${registration} was queued for certificate verification.`
        : "The new aircraft was queued for certificate verification.",
      tone: "info",
    });
    setRegistration("");
    setType("");
    setDrawerOpen(false);
  }

  return (
    <PortalPage
      title="Aircraft"
      description="Aircraft on your Air Operator Certificate with their certificate statuses."
      breadcrumb={[{ label: "Operator" }, { label: "Aircraft" }]}
      actions={
        <Button onClick={() => setDrawerOpen(true)}>
          <Plus size={15} /> Add Aircraft
        </Button>
      }
    >
      <SectionCard padded={false}>
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(item) => item.id}
          onRowClick={(item) =>
            navigate({ to: "/operator/aircraft/$aircraftId", params: { aircraftId: item.id } })
          }
          emptyTitle="No aircraft on file"
          emptyDescription="Add an aircraft to start applying for permits."
        />
      </SectionCard>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Add aircraft"
        description="Register an additional aircraft against your operator account."
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitMockAircraft}>
              <Plane size={15} /> Submit for verification
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-info-soft bg-info-soft/50 px-3.5 py-2.5">
            <Plane size={16} className="text-accent" />
            <p className="text-[12px] text-text-muted">
              Certificates are validated by the authority after submission. This demo does not save
              the record.
            </p>
          </div>
          <Field label="Registration mark" required hint="For example: A6-GWA">
            <Input
              value={registration}
              onChange={(event) => setRegistration(event.target.value)}
              placeholder="A6-"
            />
          </Field>
          <Field label="Aircraft type" required hint="Manufacturer and model">
            <Input
              value={type}
              onChange={(event) => setType(event.target.value)}
              placeholder="Boeing 737-800"
            />
          </Field>
          <Field label="Maximum take-off weight" hint="Kilograms">
            <Input type="number" placeholder="79000" />
          </Field>
          <Field label="Operator">
            <Input value={operator.company} readOnly />
          </Field>
        </div>
      </Drawer>
    </PortalPage>
  );
}
