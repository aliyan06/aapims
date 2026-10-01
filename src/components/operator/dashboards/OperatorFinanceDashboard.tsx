import { Link, useNavigate } from "@tanstack/react-router";
import { CircleDollarSign, Plus, ReceiptText, Wallet, XCircle } from "lucide-react";
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
import { useAppStore, useOperatorApplications, useWallet } from "@/store";

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

export function OperatorFinanceDashboard() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const applications = useOperatorApplications();

  const paid = applications.filter(
    (application) => application.finance.paymentStatus === "PAID",
  ).length;
  const unpaid = applications.filter(
    (application) => application.finance.paymentStatus === "UNPAID",
  ).length;

  const handleAddFunds = () => {
    useAppStore.getState().pushToast({
      title: "Wallet top-up is a demo action",
      tone: "info",
    });
  };

  const columns: Column<ApplicationRecord>[] = [
    {
      key: "reference",
      header: "Reference",
      cell: (application) => (
        <Link
          to="/operator/applications/$reference"
          params={{ reference: application.reference }}
          className="font-semibold text-accent hover:underline"
          onClick={(event) => event.stopPropagation()}
        >
          {application.reference}
        </Link>
      ),
    },
    { key: "permitType", header: "Permit Type", cell: (application) => application.permitKind },
    {
      key: "fee",
      header: "Total Fee",
      align: "right",
      cell: (application) => (
        <span className="font-semibold text-text-dark">
          {formatMoney(
            application.finance.permitFee + application.finance.processingFee,
            application.finance.currency,
          )}
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
  ];

  return (
    <PortalPage
      title="Operator Finance"
      description="Wallet position, permit fees and clearance status for the operator account."
      breadcrumb={[{ label: "Operator" }, { label: "Finance" }]}
      actions={
        <>
          <Button variant="outline" onClick={handleAddFunds}>
            <Plus size={15} /> Add funds
          </Button>
          <Link
            to="/operator/payments"
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-accent-foreground transition-colors hover:bg-accent-pressed"
          >
            <ReceiptText size={15} /> Payments &amp; wallet
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile
            label="Available balance"
            value={formatMoney(wallet.balance, wallet.currency)}
            hint="Prepaid operator wallet"
            icon={Wallet}
            tone="success"
          />
          <KpiTile
            label="Outstanding"
            value={formatMoney(wallet.outstanding, wallet.currency)}
            hint="Fees still due"
            icon={CircleDollarSign}
            tone={wallet.outstanding > 0 ? "warning" : "default"}
          />
          <KpiTile
            label="Applications paid"
            value={paid}
            hint="Fees settled"
            icon={ReceiptText}
            tone="info"
          />
          <KpiTile
            label="Applications unpaid"
            value={unpaid}
            hint="Fees awaiting payment"
            icon={XCircle}
            tone={unpaid > 0 ? "warning" : "default"}
          />
        </div>

        <SectionCard
          title="Application fees"
          description="Fees, payment status and financial clearance for each application."
          actions={
            <Link
              to="/operator/payments"
              className="text-[12px] font-semibold text-accent hover:underline"
            >
              Open payments
            </Link>
          }
          padded={false}
        >
          <DataTable
            columns={columns}
            rows={applications}
            getRowKey={(application) => application.id}
            onRowClick={(application) =>
              navigate({
                to: "/operator/applications/$reference",
                params: { reference: application.reference },
              })
            }
            emptyTitle="No fees raised"
            emptyDescription="Application fees will appear here once an application is created."
          />
        </SectionCard>
      </div>
    </PortalPage>
  );
}
