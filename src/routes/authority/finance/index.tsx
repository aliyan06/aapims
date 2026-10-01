import { useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { Button } from "@/components/ui/button";
import type { ApplicationRecord } from "@/data/types";
import { getAircraft, operatorName } from "@/data/lookups";
import { useApplications, useWorld } from "@/store";

export const Route = createFileRoute("/authority/finance/")({
  component: FinanceQueue,
});

function FinanceQueue() {
  const navigate = useNavigate();
  const world = useWorld();
  const applications = useApplications();

  const rows = useMemo(
    () =>
      applications.filter(
        (application) =>
          application.status === "AWAITING FINANCE" ||
          application.finance.financialClearance === "CLEARED",
      ),
    [applications],
  );

  const awaitingCount = applications.filter(
    (application) => application.status === "AWAITING FINANCE",
  ).length;
  const clearedCount = applications.filter(
    (application) => application.finance.financialClearance === "CLEARED",
  ).length;
  const onHoldCount = applications.filter(
    (application) => application.finance.financialClearance === "ON HOLD",
  ).length;
  const totalValue = rows.reduce(
    (sum, application) => sum + application.finance.permitFee + application.finance.processingFee,
    0,
  );
  const currency = rows[0]?.finance.currency ?? applications[0]?.finance.currency ?? "USD";

  const columns: Column<ApplicationRecord>[] = [
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
      key: "billingModel",
      header: "Billing Model",
      cell: (application) => (
        <span className="whitespace-nowrap text-text-muted">
          {application.finance.billingModel}
        </span>
      ),
    },
    {
      key: "outstanding",
      header: "Outstanding",
      align: "right",
      cell: (application) => {
        const outstanding = application.finance.outstanding ?? 0;
        if (outstanding <= 0) return "—";
        return (
          <span className="font-semibold text-status-awaiting">
            {application.finance.currency} {outstanding.toLocaleString()}
          </span>
        );
      },
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
        <Button
          variant="outline"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            navigate({
              to: "/authority/finance/$reference",
              params: { reference: application.reference },
            });
          }}
        >
          Review
        </Button>
      ),
    },
  ];

  return (
    <PortalPage
      title="Finance Clearance"
      description="Verify payment and clear the financial requirement so applications can proceed to technical review."
      breadcrumb={[{ label: "Authority" }, { label: "Finance" }]}
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile
            label="Awaiting finance"
            value={awaitingCount}
            hint="Applications pending financial clearance"
            icon={Wallet}
            tone="warning"
          />
          <KpiTile
            label="Cleared"
            value={clearedCount}
            hint="Funds verified and cleared"
            icon={CheckCircle2}
            tone="success"
          />
          <KpiTile
            label="On hold"
            value={onHoldCount}
            hint="Blocked pending bank confirmation"
            icon={PauseCircle}
            tone="danger"
          />
          <KpiTile
            label="Total value"
            value={`${currency} ${totalValue.toLocaleString()}`}
            hint="Across the finance queue"
            icon={Banknote}
            tone="info"
          />
        </div>

        <SectionCard
          title="Finance queue"
          description="Applications at the finance stage and recently cleared payments."
          padded={false}
        >
          <DataTable
            columns={columns}
            rows={rows}
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
      </div>
    </PortalPage>
  );
}
