import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, FileWarning, Info, PauseCircle, ShieldCheck } from "lucide-react";
import {
  ActionBar,
  ApplicationStatusBadge,
  ClearanceBadge,
  DescriptionList,
  EmptyState,
  PaymentBadge,
  PortalPage,
  SectionCard,
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
import { Input } from "@/components/ui/input";
import { getAircraft, operatorName } from "@/data/lookups";
import { formatDateTime, useApplication, useAppStore, useWorld } from "@/store";

export const Route = createFileRoute("/authority/finance/$reference")({
  component: FinanceDetail,
});

const DEFAULT_HOLD_REASON = "Awaiting bank confirmation";

function FinanceDetail() {
  const { reference } = Route.useParams();
  const navigate = useNavigate();
  const world = useWorld();
  const application = useApplication(reference);

  const verifyPayment = useAppStore((s) => s.verifyPayment);
  const placeFinancialHold = useAppStore((s) => s.placeFinancialHold);
  const clearFinancialHold = useAppStore((s) => s.clearFinancialHold);

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

  const isAwaitingFinance = application.status === "AWAITING FINANCE";
  const isPaid = application.finance.paymentStatus === "PAID";
  const total = application.finance.permitFee + application.finance.processingFee;
  const aircraft = getAircraft(world, application.aircraftId);

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

          <SectionCard title="Financial clearance" description="Fees, payment and clearance state.">
            <div className="mb-4 flex items-center gap-2">
              <PaymentBadge status={application.finance.paymentStatus} />
              <ClearanceBadge status={application.finance.financialClearance} />
            </div>
            <DescriptionList
              columns={1}
              items={[
                {
                  label: "Permit fee",
                  value: `${application.finance.currency} ${application.finance.permitFee.toLocaleString()}`,
                },
                {
                  label: "Processing fee",
                  value: `${application.finance.currency} ${application.finance.processingFee.toLocaleString()}`,
                },
                {
                  label: "Total",
                  value: `${application.finance.currency} ${total.toLocaleString()}`,
                },
                {
                  label: "Payment method",
                  value: application.finance.paymentMethod ?? "Not selected",
                },
                {
                  label: "Paid at",
                  value: application.finance.paidAt
                    ? formatDateTime(application.finance.paidAt)
                    : "—",
                },
                { label: "Hold reason", value: application.finance.holdReason ?? "None" },
              ]}
            />
          </SectionCard>
        </div>
      </div>

      <ActionBar>
        <div className="flex items-center gap-2 text-[12px] text-text-muted">
          <ShieldCheck size={15} className="text-accent" />
          Finance Officer actions
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled={isPaid} onClick={() => verifyPayment(application.id)}>
            <CheckCircle2 size={15} />
            {isPaid ? "Payment Verified" : "Verify Payment"}
          </Button>
          <Button variant="outline" disabled={!isAwaitingFinance} onClick={() => setHoldOpen(true)}>
            <PauseCircle size={15} />
            Place Financial Hold
          </Button>
          <Button disabled={!isAwaitingFinance} onClick={() => clearFinancialHold(application.id)}>
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
          <Input
            value={holdReason}
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
