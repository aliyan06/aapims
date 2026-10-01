import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  ClipboardCheck,
  FileWarning,
  Info,
  PauseCircle,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import {
  ActionBar,
  ApplicationStatusBadge,
  Checklist,
  ClearanceBadge,
  DescriptionList,
  EmptyState,
  PaymentBadge,
  PortalPage,
  SectionCard,
  type ChecklistItem,
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
import { Textarea } from "@/components/ui/textarea";
import { getAircraft, operatorName } from "@/data";
import {
  formatDate,
  formatDateTime,
  useApplication,
  useAppStore,
  usePermission,
  useWallet,
  useWorld,
} from "@/store";

export const Route = createFileRoute("/authority/finance/$reference")({
  component: FinanceDetail,
});

const DEFAULT_HOLD_REASON = "Awaiting bank confirmation";

function FinanceDetail() {
  const { reference } = Route.useParams();
  const navigate = useNavigate();
  const world = useWorld();
  const wallet = useWallet();
  const application = useApplication(reference);

  const verifyPayment = useAppStore((s) => s.verifyPayment);
  const placeFinancialHold = useAppStore((s) => s.placeFinancialHold);
  const clearFinancialHold = useAppStore((s) => s.clearFinancialHold);

  const canVerify = usePermission("finance.verify");
  const canHold = usePermission("finance.hold");

  const [holdOpen, setHoldOpen] = useState(false);
  const [holdReason, setHoldReason] = useState(DEFAULT_HOLD_REASON);

  if (!application) {
    return (
      <PortalPage
        title="Application not found"
        breadcrumb={[{ label: "Finance", to: "/authority/finance" }]}
      >
        <EmptyState
          icon={FileWarning}
          title="Unknown application reference"
          description={`No application matches ${reference}.`}
          action={
            <Button onClick={() => navigate({ to: "/authority/finance" })}>
              Back to finance queue
            </Button>
          }
        />
      </PortalPage>
    );
  }

  const finance = application.finance;
  const isAwaitingFinance = application.status === "AWAITING FINANCE";
  const isPaid = finance.paymentStatus === "PAID";
  const isPostpaid = finance.billingModel === "Postpaid";
  const total = finance.permitFee + finance.processingFee;
  const outstanding = finance.outstanding ?? 0;
  const hasOutstanding = outstanding > 0;
  const hasHold = finance.financialClearance === "ON HOLD";
  const balanceSufficient = wallet.balance >= total;
  const aircraft = getAircraft(world, application.aircraftId);

  const eligibility: ChecklistItem[] = [
    {
      id: "balance",
      label: "Wallet / advance balance sufficient",
      detail: `${finance.currency} ${wallet.balance.toLocaleString()} available against ${finance.currency} ${total.toLocaleString()} due.`,
      outcome: balanceSufficient ? "PASS" : "WARNING",
    },
    {
      id: "payment",
      label: "Payment received",
      detail: isPaid
        ? `Payment verified${finance.paidAt ? ` on ${formatDateTime(finance.paidAt)}` : ""}.`
        : "No verified payment on record for this application.",
      outcome: isPaid ? "PASS" : "WARNING",
    },
    {
      id: "hold",
      label: "No outstanding hold",
      detail: hasHold
        ? (finance.holdReason ?? "A financial hold is active.")
        : hasOutstanding
          ? `${finance.currency} ${outstanding.toLocaleString()} outstanding on ${finance.invoiceNumber ?? "the invoice"}.`
          : "No financial hold or outstanding balance on record.",
      outcome: !hasHold && !hasOutstanding ? "PASS" : "WARNING",
    },
  ];

  function onConfirmHold() {
    if (!application) return;
    const reason = holdReason.trim() || DEFAULT_HOLD_REASON;
    placeFinancialHold(application.id, reason);
    setHoldOpen(false);
    setHoldReason(DEFAULT_HOLD_REASON);
  }

  return (
    <PortalPage
      title={application.reference}
      description="Verify payment and clear the financial requirement for this application."
      breadcrumb={[
        { label: "Finance", to: "/authority/finance" },
        { label: application.reference },
      ]}
      actions={<ApplicationStatusBadge status={application.status} />}
    >
      <div className="space-y-5 pb-4">
        {!isAwaitingFinance ? (
          <div className="flex items-start gap-3 rounded-xl border border-border-soft bg-info-soft px-4 py-3">
            <Info size={18} className="mt-0.5 shrink-0 text-accent" />
            <div>
              <p className="text-[13px] font-bold text-text-dark">
                This application is no longer awaiting finance.
              </p>
              <p className="text-[12px] text-text-muted">
                Current stage: {application.status}. The financial hold can only be cleared while
                the application is at AWAITING FINANCE.
              </p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <SectionCard title="Application" description="Applicant and aircraft on record.">
              <DescriptionList
                columns={2}
                items={[
                  { label: "Application", value: application.reference },
                  { label: "Operator", value: operatorName(world, application.operatorId) },
                  {
                    label: "Aircraft",
                    value: `${aircraft.registration} · ${aircraft.type}`,
                  },
                  { label: "Authorization", value: application.authorization },
                  { label: "Permit kind", value: application.permitKind },
                  { label: "Category", value: application.category },
                  {
                    label: "Route",
                    value: `${application.route.origin} (${application.route.originIcao}) → ${application.route.destination} (${application.route.destinationIcao})`,
                    fullWidth: true,
                  },
                ]}
              />
            </SectionCard>

            <SectionCard
              title="Financial summary"
              description="Fees, billing model and the current payment state."
            >
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <PaymentBadge status={finance.paymentStatus} />
                <ClearanceBadge status={finance.financialClearance} />
              </div>
              <DescriptionList
                columns={2}
                items={[
                  {
                    label: "Permit fee",
                    value: `${finance.currency} ${finance.permitFee.toLocaleString()}`,
                  },
                  {
                    label: "Processing fee",
                    value: `${finance.currency} ${finance.processingFee.toLocaleString()}`,
                  },
                  {
                    label: "Total",
                    value: `${finance.currency} ${total.toLocaleString()}`,
                  },
                  { label: "Billing model", value: finance.billingModel },
                  { label: "Payment method", value: finance.paymentMethod ?? "Not selected" },
                  {
                    label: "Paid at",
                    value: finance.paidAt ? formatDateTime(finance.paidAt) : "—",
                  },
                  ...(isPostpaid
                    ? [
                        { label: "Invoice number", value: finance.invoiceNumber ?? "—" },
                        {
                          label: "Due date",
                          value: finance.dueDate ? formatDate(finance.dueDate) : "—",
                        },
                        {
                          label: "Outstanding",
                          value: `${finance.currency} ${outstanding.toLocaleString()}`,
                        },
                      ]
                    : []),
                  { label: "Hold reason", value: finance.holdReason ?? "None" },
                ]}
              />
            </SectionCard>
          </div>

          <div className="space-y-5">
            <SectionCard
              title="Wallet / advance balance"
              description="Operator funds held against authority fees."
            >
              <div className="mb-4 flex items-center gap-2 text-accent">
                <Wallet size={16} />
                <span className="text-[12px] font-semibold uppercase tracking-wide">
                  Prepaid account
                </span>
              </div>
              <DescriptionList
                columns={1}
                items={[
                  {
                    label: "Available balance",
                    value: `${wallet.currency} ${wallet.balance.toLocaleString()}`,
                  },
                  {
                    label: "Outstanding",
                    value: `${wallet.currency} ${wallet.outstanding.toLocaleString()}`,
                  },
                  {
                    label: "Billing model",
                    value: finance.billingModel,
                  },
                ]}
              />
            </SectionCard>

            <SectionCard
              title="Financial eligibility"
              description="Automated checks against the wallet and application."
              actions={<ClipboardCheck size={16} className="text-accent" />}
            >
              <Checklist items={eligibility} />
            </SectionCard>
          </div>
        </div>
      </div>

      <ActionBar>
        <div className="flex items-center gap-2 text-[12px] text-text-muted">
          <ShieldCheck size={15} className="text-accent" />
          Finance Officer actions
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={isPaid || !canVerify}
            onClick={() => verifyPayment(application.id)}
          >
            <CheckCircle2 size={15} />
            {isPaid ? "Payment Verified" : "Verify Payment"}
          </Button>
          <Button
            variant="outline"
            disabled={!isAwaitingFinance || !canHold}
            onClick={() => setHoldOpen(true)}
          >
            <PauseCircle size={15} />
            Place Financial Hold
          </Button>
          <Button
            disabled={!isAwaitingFinance || !canHold}
            onClick={() => clearFinancialHold(application.id)}
          >
            <ShieldCheck size={15} />
            Clear Financial Hold
          </Button>
        </div>
      </ActionBar>

      <Dialog open={holdOpen} onOpenChange={setHoldOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Place financial hold</DialogTitle>
            <DialogDescription>
              Provide a reason for holding {application.reference}. The operator will be notified.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={holdReason}
            rows={3}
            onChange={(event) => setHoldReason(event.target.value)}
            placeholder={DEFAULT_HOLD_REASON}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setHoldOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirmHold}>
              Place Hold
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PortalPage>
  );
}
