import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Banknote, CircleDollarSign, Plus, ReceiptText, Wallet } from "lucide-react";
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
import type { ApplicationRecord } from "@/data";
import { useAppStore, useOperatorApplications, useWallet } from "@/store";

export const Route = createFileRoute("/operator/payments")({
  component: PaymentsPage,
});

function PaymentsPage() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const applications = useOperatorApplications();
  const pushToast = useAppStore((s) => s.pushToast);

  const totalFees = applications.reduce(
    (sum, application) => sum + application.finance.permitFee + application.finance.processingFee,
    0,
  );
  const pendingClearance = applications.filter(
    (application) => application.finance.financialClearance === "PENDING CLEARANCE",
  ).length;

  const handleAddFunds = () => {
    pushToast({
      title: "Add funds",
      description: "Top-up options are disabled in this demonstration environment.",
      tone: "info",
    });
  };

  const handlePayNow = (application: ApplicationRecord) => {
    const total = application.finance.permitFee + application.finance.processingFee;
    pushToast({
      title: "Payment initiated",
      description: `${application.finance.currency} ${total.toLocaleString()} for ${application.reference} is being processed.`,
      tone: "success",
    });
  };

  const columns: Column<ApplicationRecord>[] = [
    {
      key: "reference",
      header: "Reference",
      cell: (application) => (
        <span className="font-semibold text-text-dark">{application.reference}</span>
      ),
    },
    { key: "permitType", header: "Permit Type", cell: (application) => application.permitKind },
    {
      key: "fees",
      header: "Total Fees",
      align: "right",
      cell: (application) =>
        `${application.finance.currency} ${(
          application.finance.permitFee + application.finance.processingFee
        ).toLocaleString()}`,
    },
    {
      key: "method",
      header: "Method",
      cell: (application) => application.finance.paymentMethod ?? "Not selected",
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
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              handlePayNow(application);
            }}
          >
            Pay Now
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              navigate({
                to: "/operator/applications/$reference",
                params: { reference: application.reference },
              });
            }}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PortalPage
      title="Payments & Wallet"
      description="Permit fees, processing charges and your prepaid operator wallet."
      breadcrumb={[{ label: "Operator" }, { label: "Payments" }]}
      actions={
        <Button onClick={handleAddFunds}>
          <Plus size={15} /> Add Funds
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile
            label="Wallet balance"
            value={`${wallet.currency} ${wallet.balance.toLocaleString()}`}
            icon={Wallet}
            tone="success"
          />
          <KpiTile
            label="Outstanding"
            value={`${wallet.currency} ${wallet.outstanding.toLocaleString()}`}
            icon={CircleDollarSign}
            tone={wallet.outstanding > 0 ? "warning" : "default"}
          />
          <KpiTile
            label="Total fees raised"
            value={`${wallet.currency} ${totalFees.toLocaleString()}`}
            icon={ReceiptText}
            tone="info"
          />
          <KpiTile
            label="Pending clearance"
            value={pendingClearance}
            icon={Banknote}
            tone="warning"
          />
        </div>

        <SectionCard
          title="Application Fees"
          description="Fees and clearance status for every application on your account."
          padded={false}
        >
          <DataTable
            columns={columns}
            rows={applications}
            getRowKey={(application) => application.id}
            emptyTitle="No fees raised"
            emptyDescription="Application fees will appear here once you submit an application."
          />
        </SectionCard>
      </div>
    </PortalPage>
  );
}
