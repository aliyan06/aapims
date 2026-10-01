import { Link, useNavigate } from "@tanstack/react-router";
import { Banknote, CheckCircle2, PauseCircle, Wallet } from "lucide-react";
import {
  ClearanceBadge,
  DataTable,
  KpiTile,
  PaymentBadge,
  PortalPage,
  SectionCard,
  type Column,
} from "@/components/desktop";
import { getAircraft, operatorName } from "@/data";
import type { ApplicationRecord } from "@/data/types";
import { useApplications, useWorld } from "@/store";

export function FinanceDashboard() {
  const navigate = useNavigate();
  const world = useWorld();
  const applications = useApplications();

  const awaiting = applications.filter((application) => application.status === "AWAITING FINANCE");
  const onHold = applications.filter(
    (application) => application.finance.financialClearance === "ON HOLD",
  );
  const cleared = applications.filter(
    (application) => application.finance.financialClearance === "CLEARED",
  );

  const totalPending = awaiting.reduce(
    (sum, application) => sum + application.finance.permitFee + application.finance.processingFee,
    0,
  );

  const queueColumns: Column<ApplicationRecord>[] = [
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
    {
      key: "permitFee",
      header: "Permit Fee",
      align: "right",
      cell: (application) =>
        `${application.finance.currency} ${application.finance.permitFee.toLocaleString()}`,
    },
    {
      key: "processingFee",
      header: "Processing Fee",
      align: "right",
      cell: (application) =>
        `${application.finance.currency} ${application.finance.processingFee.toLocaleString()}`,
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      cell: (application) => (
        <span className="font-semibold text-text-dark">
          {application.finance.currency}{" "}
          {(application.finance.permitFee + application.finance.processingFee).toLocaleString()}
        </span>
      ),
    },
    {
      key: "payment",
      header: "Payment",
      cell: (application) => <PaymentBadge status={application.finance.paymentStatus} />,
    },
    {
      key: "clearance",
      header: "Clearance",
      cell: (application) => <ClearanceBadge status={application.finance.financialClearance} />,
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
              to: "/authority/finance/$reference",
              params: { reference: application.reference },
            });
          }}
        >
          Review
        </button>
      ),
    },
  ];

  const clearedColumns: Column<ApplicationRecord>[] = [
    {
      key: "reference",
      header: "Reference",
      cell: (application) => (
        <span className="font-semibold text-text-dark">{application.reference}</span>
      ),
    },
    {
      key: "operator",
      header: "Operator",
      cell: (application) => operatorName(world, application.operatorId),
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      cell: (application) =>
        `${application.finance.currency} ${(
          application.finance.permitFee + application.finance.processingFee
        ).toLocaleString()}`,
    },
    {
      key: "clearance",
      header: "Clearance",
      cell: (application) => <ClearanceBadge status={application.finance.financialClearance} />,
    },
  ];

  return (
    <PortalPage
      title="Finance Clearance Dashboard"
      description="The Finance Officer desk verifies payment and clears the financial requirement before applications move to technical review."
      breadcrumb={[{ label: "Authority" }, { label: "Dashboard" }]}
      actions={
        <Link
          to="/authority/finance"
          className="text-[12px] font-semibold text-accent hover:underline"
        >
          Open finance queue
        </Link>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile
            label="Awaiting financial clearance"
            value={awaiting.length}
            hint="Held at the finance desk"
            icon={Wallet}
            tone="warning"
            onClick={() => navigate({ to: "/authority/finance" })}
          />
          <KpiTile
            label="On hold"
            value={onHold.length}
            hint="Blocked pending confirmation"
            icon={PauseCircle}
            tone="danger"
            onClick={() => navigate({ to: "/authority/finance" })}
          />
          <KpiTile
            label="Cleared"
            value={cleared.length}
            hint="Funds verified and released"
            icon={CheckCircle2}
            tone="success"
          />
          <KpiTile
            label="Total value pending"
            value={`USD ${totalPending.toLocaleString()}`}
            hint="Fees held in the clearance queue"
            icon={Banknote}
            tone="info"
          />
        </div>

        <SectionCard
          title="Clearance queue"
          description="Applications awaiting financial clearance, newest first."
          actions={
            <Link
              to="/authority/finance"
              className="text-[12px] font-semibold text-accent hover:underline"
            >
              View all
            </Link>
          }
          padded={false}
        >
          <DataTable
            columns={queueColumns}
            rows={awaiting}
            getRowKey={(application) => application.id}
            onRowClick={(application) =>
              navigate({
                to: "/authority/finance/$reference",
                params: { reference: application.reference },
              })
            }
            emptyTitle="Nothing awaiting finance"
            emptyDescription="Applications reach this queue once the reviewer recommends them."
          />
        </SectionCard>

        <SectionCard
          title="Recently cleared"
          description="Applications whose funds have been verified and cleared."
          padded={false}
        >
          <DataTable
            columns={clearedColumns}
            rows={cleared}
            getRowKey={(application) => application.id}
            onRowClick={(application) =>
              navigate({
                to: "/authority/finance/$reference",
                params: { reference: application.reference },
              })
            }
            emptyTitle="No cleared payments yet"
            emptyDescription="Cleared applications will be listed here for reference."
          />
        </SectionCard>
      </div>
    </PortalPage>
  );
}
