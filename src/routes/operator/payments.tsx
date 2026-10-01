import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Banknote,
  CircleDollarSign,
  CreditCard,
  Lock,
  Plus,
  ReceiptText,
  Wallet,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ApplicationRecord } from "@/data";
import {
  formatDate,
  useAppStore,
  useOperatorApplications,
  usePermission,
  useWallet,
} from "@/store";

export const Route = createFileRoute("/operator/payments")({
  component: PaymentsPage,
});

function totalOf(application: ApplicationRecord): number {
  return application.finance.permitFee + application.finance.processingFee;
}

function money(currency: string, amount: number): string {
  return `${currency} ${amount.toLocaleString()}`;
}

function PaymentsPage() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const applications = useOperatorApplications();
  const pushToast = useAppStore((s) => s.pushToast);
  const payApplication = useAppStore((s) => s.payApplication);
  const canManagePayments = usePermission("payment.manage");

  const [selected, setSelected] = useState<ApplicationRecord | null>(null);

  const unpaid = applications.filter((application) => application.finance.paymentStatus !== "PAID");
  const paid = applications.filter((application) => application.finance.paymentStatus === "PAID");

  const totalFees = applications.reduce((sum, application) => sum + totalOf(application), 0);
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

  const openApplication = (application: ApplicationRecord) => {
    navigate({
      to: "/operator/applications/$reference",
      params: { reference: application.reference },
    });
  };

  const handleConfirmPayment = (method: "wallet" | "online") => {
    if (!selected) return;
    payApplication(selected.id, method);
    setSelected(null);
  };

  const unpaidColumns: Column<ApplicationRecord>[] = [
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
      header: "Total",
      align: "right",
      cell: (application) => money(application.finance.currency, totalOf(application)),
    },
    {
      key: "payment",
      header: "Payment",
      cell: (application) => <PaymentBadge status={application.finance.paymentStatus} />,
    },
    {
      key: "action",
      header: "",
      align: "right",
      cell: (application) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            disabled={!canManagePayments}
            onClick={(event) => {
              event.stopPropagation();
              setSelected(application);
            }}
          >
            <CreditCard size={14} /> Pay
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              openApplication(application);
            }}
          >
            View
          </Button>
        </div>
      ),
    },
  ];

  const paidColumns: Column<ApplicationRecord>[] = [
    {
      key: "reference",
      header: "Reference",
      cell: (application) => (
        <span className="font-semibold text-text-dark">{application.reference}</span>
      ),
    },
    {
      key: "fees",
      header: "Total",
      align: "right",
      cell: (application) => money(application.finance.currency, totalOf(application)),
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
      key: "invoice",
      header: "Invoice",
      cell: (application) => application.finance.invoiceNumber ?? "—",
    },
    {
      key: "due",
      header: "Due",
      cell: (application) =>
        application.finance.dueDate ? formatDate(application.finance.dueDate) : "—",
    },
    {
      key: "outstanding",
      header: "Outstanding",
      align: "right",
      cell: (application) =>
        money(application.finance.currency, application.finance.outstanding ?? 0),
    },
    {
      key: "action",
      header: "",
      align: "right",
      cell: (application) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            openApplication(application);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  const selectedTotal = selected ? totalOf(selected) : 0;
  const remainingAfterWallet = Math.max(wallet.balance - selectedTotal, 0);

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
            value={money(wallet.currency, wallet.balance)}
            icon={Wallet}
            tone="success"
          />
          <KpiTile
            label="Outstanding"
            value={money(wallet.currency, wallet.outstanding)}
            icon={CircleDollarSign}
            tone={wallet.outstanding > 0 ? "warning" : "default"}
          />
          <KpiTile
            label="Total fees raised"
            value={money(wallet.currency, totalFees)}
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

        {!canManagePayments ? (
          <div className="flex items-center gap-2 rounded-xl border border-border-soft bg-surface-muted px-4 py-3 text-[12px] text-text-muted">
            <Lock size={15} className="text-text-subtle" />
            Your role has read-only access to payments. An operator finance user must settle fees.
          </div>
        ) : null}

        <SectionCard
          title="Unpaid Fees"
          description="Applications awaiting settlement. Pay from your wallet or via the demo gateway."
          padded={false}
        >
          <DataTable
            columns={unpaidColumns}
            rows={unpaid}
            getRowKey={(application) => application.id}
            emptyTitle="No outstanding fees"
            emptyDescription="Every application on your account has been paid."
          />
        </SectionCard>

        <SectionCard
          title="Paid Fees"
          description="Settled applications with invoice, due date and clearance status."
          padded={false}
        >
          <DataTable
            columns={paidColumns}
            rows={paid}
            getRowKey={(application) => application.id}
            emptyTitle="No payments recorded"
            emptyDescription="Paid application fees will appear here once settled."
          />
        </SectionCard>
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-w-md">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>Pay permit fees</DialogTitle>
                <DialogDescription>
                  Settle {money(selected.finance.currency, selectedTotal)} for {selected.reference}.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div className="rounded-lg border border-border-soft bg-surface-muted px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-text-dark">
                      Advance Deposit / Wallet
                    </span>
                    <Wallet size={16} className="text-accent" />
                  </div>
                  <p className="mt-1 text-[12px] text-text-muted">
                    Available balance: {money(wallet.currency, wallet.balance)}
                  </p>
                  <p className="text-[12px] text-text-muted">
                    Remaining after payment: {money(wallet.currency, remainingAfterWallet)}
                  </p>
                  <Button
                    className="mt-3 w-full"
                    disabled={wallet.balance < selectedTotal}
                    onClick={() => handleConfirmPayment("wallet")}
                  >
                    Pay with wallet
                  </Button>
                  {wallet.balance < selectedTotal ? (
                    <p className="mt-2 text-[12px] text-status-rejected">
                      Wallet balance is below this total. Add funds or pay online.
                    </p>
                  ) : null}
                </div>

                <div className="rounded-lg border border-border-soft px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-text-dark">
                      Online Payment (demo)
                    </span>
                    <CreditCard size={16} className="text-accent" />
                  </div>
                  <p className="mt-1 text-[12px] text-text-muted">
                    Simulated card gateway for this demonstration environment.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => handleConfirmPayment("online")}
                  >
                    Pay online
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Cancel
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </PortalPage>
  );
}
