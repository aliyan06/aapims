import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  Info,
  Package,
  Plane,
  RefreshCw,
  Save,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import {
  ActionBar,
  Checklist,
  ClearanceBadge,
  DescriptionList,
  DocumentStatusBadge,
  Field,
  PaymentBadge,
  PortalPage,
  SectionCard,
  StepIndicator,
  ValidationBadge,
} from "@/components/desktop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FLIGHT_CATEGORIES,
  PERMIT_AUTHORIZATIONS,
  PERMIT_KINDS,
  SPECIAL_DOCUMENT_CATEGORIES,
  STORY_IDS,
  type FlightCategory,
  type PermitAuthorization,
  type PermitKind,
  type ValidationOutcome,
} from "@/data";
import {
  formatDate,
  useAircraft,
  useApplication,
  useAppStore,
  useAuthority,
  useDocuments,
  useOperator,
  useWallet,
} from "@/store";
import { cn } from "@/lib/utils";

const STEPS = [
  "Permit Type",
  "Operator & Aircraft",
  "Flight Category",
  "Flight Details",
  "PAX / Cargo",
  "Route & Schedule",
  "Documents",
  "Validation",
  "Payment",
  "Review & Submit",
] as const;

type WizardForm = {
  authorization: PermitAuthorization;
  permitKind: PermitKind;
  aircraftId: string;
  category: FlightCategory;
  flightNumber: string;
  callSign: string;
  passengerCount: string;
  cargo: string;
  purpose: string;
  specialInfo: string;
  passengerManifest: string;
  receivingParty: string;
  receivingPartyContact: string;
  cargoManifest: string;
  shipper: string;
  consignee: string;
  airWaybill: string;
  origin: string;
  originIcao: string;
  destination: string;
  destinationIcao: string;
  entryPoint: string;
  exitPoint: string;
  departureAt: string;
  arrivalAt: string;
  estimatedEntryAt: string;
  estimatedExitAt: string;
  departureSlot: string;
  arrivalSlot: string;
  groundHandlingAgent: string;
  purposeOfVisit: string;
  timezone: string;
};

function optionClass(active: boolean): string {
  return cn(
    "flex w-full flex-col rounded-xl border p-3.5 text-left transition-colors",
    active
      ? "border-accent bg-info-soft ring-1 ring-accent"
      : "border-border-soft bg-surface hover:border-accent/50 hover:bg-info-soft/40",
  );
}

function validationBannerClasses(outcome: ValidationOutcome): string {
  switch (outcome) {
    case "PASS":
      return "border-status-cleared/30 bg-success-soft";
    case "WARNING":
      return "border-status-awaiting/30 bg-warning-soft";
    case "BLOCKER":
      return "border-status-rejected/30 bg-danger-soft";
  }
}

function validationIconClasses(outcome: ValidationOutcome): string {
  switch (outcome) {
    case "PASS":
      return "text-status-cleared";
    case "WARNING":
      return "text-status-awaiting";
    case "BLOCKER":
      return "text-status-rejected";
  }
}

export function ApplyWizard() {
  const navigate = useNavigate();
  const application = useApplication(STORY_IDS.application);
  const operator = useOperator();
  const aircraftList = useAircraft();
  const documents = useDocuments();
  const wallet = useWallet();
  const authority = useAuthority();
  const submitApplication = useAppStore((s) => s.submitApplication);
  const payApplication = useAppStore((s) => s.payApplication);
  const runApplicationValidation = useAppStore((s) => s.runApplicationValidation);
  const pushToast = useAppStore((s) => s.pushToast);

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<WizardForm>(() => ({
    authorization: application?.authorization ?? "OVERFLIGHT",
    permitKind: application?.permitKind ?? "SINGLE PERMIT",
    aircraftId: application?.aircraftId ?? STORY_IDS.aircraft,
    category: application?.category ?? "Commercial Non-Scheduled / Ad-hoc",
    flightNumber: application?.flight.flightNumber ?? "",
    callSign: application?.flight.callSign ?? "",
    passengerCount: String(application?.flight.passengerCount ?? 0),
    cargo: application?.flight.cargo ?? "",
    purpose: application?.flight.purpose ?? "",
    specialInfo: application?.flight.specialInfo ?? "",
    passengerManifest: application?.flight.passengerManifest ?? "",
    receivingParty: application?.flight.receivingParty ?? "",
    receivingPartyContact: application?.flight.receivingPartyContact ?? "",
    cargoManifest: application?.flight.cargoManifest ?? "",
    shipper: application?.flight.shipper ?? "",
    consignee: application?.flight.consignee ?? "",
    airWaybill: application?.flight.airWaybill ?? "",
    origin: application?.route.origin ?? "",
    originIcao: application?.route.originIcao ?? "",
    destination: application?.route.destination ?? "",
    destinationIcao: application?.route.destinationIcao ?? "",
    entryPoint: application?.route.entryPoint ?? "",
    exitPoint: application?.route.exitPoint ?? "",
    departureAt: application?.route.departureAt ?? "",
    arrivalAt: application?.route.arrivalAt ?? "",
    estimatedEntryAt: application?.route.estimatedEntryAt ?? "",
    estimatedExitAt: application?.route.estimatedExitAt ?? "",
    departureSlot: application?.route.departureSlot ?? "",
    arrivalSlot: application?.route.arrivalSlot ?? "",
    groundHandlingAgent: application?.route.groundHandlingAgent ?? "",
    purposeOfVisit: application?.route.purposeOfVisit ?? "",
    timezone: application?.route.timezone ?? "UTC",
  }));

  if (!application) {
    return (
      <PortalPage
        title="Apply for Permit"
        description="Loading your pre-filled application details…"
      >
        <SectionCard>
          <p className="text-[13px] text-text-muted">
            No application is available in the demo world.
          </p>
        </SectionCard>
      </PortalPage>
    );
  }

  const operatorAircraft = aircraftList.filter((item) => item.operatorId === operator.id);
  const heroAircraft =
    aircraftList.find((item) => item.id === form.aircraftId) ?? operatorAircraft[0];
  const applicationDocuments = documents.filter((doc) => application.documentIds.includes(doc.id));
  const isCargo = form.category === "Cargo";
  const isLanding = form.authorization === "LANDING";
  const requiresSpecialDocuments = SPECIAL_DOCUMENT_CATEGORIES.includes(form.category);
  const permitFee = application.finance.permitFee;
  const processingFee = application.finance.processingFee;
  const currency = application.finance.currency;
  const total = permitFee + processingFee;
  const remainingBalance = wallet.balance - total;
  const paymentStatus = application.finance.paymentStatus;
  const clearance = application.finance.financialClearance;
  const storedPaymentMethod = application.finance.paymentMethod;
  const isPaid = paymentStatus === "PAID";

  const setField = <K extends keyof WizardForm>(key: K, value: WizardForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleUpload = (documentName: string) => {
    pushToast({
      title: "Upload queued",
      description: `${documentName} — replacement file staged for verification.`,
      tone: "info",
    });
  };
  const handleSaveDraft = () => {
    pushToast({
      title: "Draft saved",
      description: `Application ${application.reference} remains a draft.`,
      tone: "success",
    });
  };

  const handleSubmit = () => {
    const ok = submitApplication(STORY_IDS.application);
    if (ok) {
      setSubmitted(true);
      return;
    }
    pushToast({
      title: "Application already submitted",
      description: `${application.reference} is no longer a draft.`,
      tone: "info",
    });
  };

  const handleRunValidation = () => {
    runApplicationValidation(STORY_IDS.application);
  };

  const handlePay = (method: "wallet" | "online") => {
    payApplication(STORY_IDS.application, method);
  };

  const goNext = () => setStep((current) => Math.min(current + 1, STEPS.length - 1));
  const goBack = () => setStep((current) => Math.max(current - 1, 0));

  if (submitted) {
    return (
      <PortalPage
        title="Application Submitted"
        description="Your permit application has been received and is now in the authority review queue."
        breadcrumb={[{ label: "Operator" }, { label: "Applications" }]}
      >
        <div className="mx-auto max-w-2xl">
          <SectionCard>
            <div className="flex flex-col items-center px-6 py-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-status-cleared">
                <CheckCircle2 size={30} />
              </span>
              <h2 className="mt-4 text-[18px] font-extrabold text-text-dark">
                Submission successful
              </h2>
              <p className="mt-1 max-w-md text-[13px] text-text-muted">
                Reference{" "}
                <span className="font-bold text-text-dark">{STORY_IDS.applicationReference}</span>{" "}
                has been lodged with {authority.name}. You will be notified as each stage completes.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={() =>
                    navigate({
                      to: "/operator/applications/$reference",
                      params: { reference: STORY_IDS.applicationReference },
                    })
                  }
                >
                  View application
                </Button>
                <Button variant="outline" onClick={() => navigate({ to: "/operator/dashboard" })}>
                  Back to dashboard
                </Button>
              </div>
            </div>
          </SectionCard>
        </div>
      </PortalPage>
    );
  }

  return (
    <PortalPage
      title="Apply for a Permit"
      description="Complete the guided application. Details are pre-filled from your verified operator profile and aircraft records."
      breadcrumb={[{ label: "Operator" }, { label: "Apply" }]}
    >
      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <SectionCard title="Application steps" className="h-fit">
          <StepIndicator steps={STEPS} current={step} onStepClick={(index) => setStep(index)} />
        </SectionCard>

        <div className="min-w-0 space-y-5">
          {step === 0 ? (
            <SectionCard
              title="Permit Type"
              description="Select the authorization and the permit kind you require."
            >
              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-[12px] font-semibold text-text-dark">Authorization</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {PERMIT_AUTHORIZATIONS.map((authorization) => (
                      <button
                        key={authorization}
                        type="button"
                        onClick={() => setField("authorization", authorization)}
                        className={optionClass(form.authorization === authorization)}
                      >
                        <span className="flex items-center gap-2 text-[13px] font-bold text-text-dark">
                          <Plane size={16} className="text-accent" />
                          {authorization === "OVERFLIGHT" ? "Overflight Permit" : "Landing Permit"}
                        </span>
                        <span className="mt-1 text-[12px] text-text-muted">
                          {authorization === "OVERFLIGHT"
                            ? "Transit through the airspace without landing."
                            : "Landing and ground operations at a designated airport."}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[12px] font-semibold text-text-dark">Permit kind</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {PERMIT_KINDS.map((kind) => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => setField("permitKind", kind)}
                        className={optionClass(form.permitKind === kind)}
                      >
                        <span className="text-[13px] font-bold text-text-dark">{kind}</span>
                        <span className="mt-1 text-[12px] text-text-muted">
                          {kind === "SINGLE PERMIT"
                            ? "One flight, one authorisation."
                            : kind === "BLOCK PERMIT"
                              ? "Multiple flights under one approval."
                              : kind === "SEASONAL PERMIT"
                                ? "Recurring operations across a season."
                                : "Filed for operations without online access."}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          ) : null}

          {step === 1 ? (
            <SectionCard
              title="Operator & Aircraft"
              description="Your verified operator profile is applied automatically."
            >
              <div className="space-y-5">
                <div className="rounded-xl border border-border-soft bg-surface-muted p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Building2 size={18} />
                    </span>
                    <div>
                      <p className="text-[14px] font-bold text-text-dark">{operator.company}</p>
                      <p className="mt-0.5 text-[12px] text-text-muted">
                        {operator.operatorId} · {operator.country} · AOC {operator.aocNumber}
                      </p>
                      <p className="mt-1 text-[12px] text-status-cleared">
                        AOC valid until {formatDate(operator.aocValidUntil)} · KYC{" "}
                        {operator.kycStatus}
                      </p>
                    </div>
                  </div>
                </div>
                <Field label="Aircraft" required>
                  <Select
                    value={form.aircraftId}
                    onValueChange={(value) => setField("aircraftId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select aircraft" />
                    </SelectTrigger>
                    <SelectContent>
                      {operatorAircraft.map((aircraft) => (
                        <SelectItem key={aircraft.id} value={aircraft.id}>
                          {aircraft.registration} · {aircraft.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                {heroAircraft ? (
                  <DescriptionList
                    columns={3}
                    items={[
                      { label: "Registration", value: heroAircraft.registration },
                      { label: "Type", value: heroAircraft.type },
                      { label: "MTOW", value: `${heroAircraft.mtowKg.toLocaleString()} kg` },
                      {
                        label: "Airworthiness",
                        value: (
                          <DocumentStatusBadge
                            status={heroAircraft.certificates.airworthiness.status}
                          />
                        ),
                      },
                      {
                        label: "Insurance",
                        value: (
                          <DocumentStatusBadge
                            status={heroAircraft.certificates.insurance.status}
                          />
                        ),
                      },
                      {
                        label: "Noise certificate",
                        value: (
                          <DocumentStatusBadge status={heroAircraft.certificates.noise.status} />
                        ),
                      },
                    ]}
                  />
                ) : null}
              </div>
            </SectionCard>
          ) : null}

          {step === 2 ? (
            <SectionCard
              title="Flight Category"
              description="Classify the operation for the authority."
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {FLIGHT_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setField("category", category)}
                    className={optionClass(form.category === category)}
                  >
                    <span className="text-[13px] font-semibold text-text-dark">{category}</span>
                  </button>
                ))}
              </div>
            </SectionCard>
          ) : null}

          {step === 3 ? (
            <SectionCard
              title="Flight Details"
              description="Operational details as filed for the flight."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Flight number" required>
                  <Input
                    value={form.flightNumber}
                    onChange={(e) => setField("flightNumber", e.target.value)}
                  />
                </Field>
                <Field label="Call sign" required>
                  <Input
                    value={form.callSign}
                    onChange={(e) => setField("callSign", e.target.value)}
                  />
                </Field>
                <Field label="Passengers">
                  <Input
                    type="number"
                    value={form.passengerCount}
                    onChange={(e) => setField("passengerCount", e.target.value)}
                  />
                </Field>
                <Field label="Cargo">
                  <Input value={form.cargo} onChange={(e) => setField("cargo", e.target.value)} />
                </Field>
                <Field label="Purpose of flight" className="sm:col-span-2">
                  <Input
                    value={form.purpose}
                    onChange={(e) => setField("purpose", e.target.value)}
                  />
                </Field>
                <Field
                  label="Special information"
                  className="sm:col-span-2"
                  hint="Remarks the authority should consider — dangerous goods, medical cases, diplomatic status, or other special handling."
                >
                  <Textarea
                    value={form.specialInfo}
                    onChange={(e) => setField("specialInfo", e.target.value)}
                    rows={3}
                    placeholder="e.g. Standard scheduled rotation; no special handling required."
                  />
                </Field>
              </div>
            </SectionCard>
          ) : null}

          {step === 4 ? (
            <SectionCard
              title="PAX / Cargo"
              description="Nature-specific manifest detail collected for the selected flight category."
              actions={
                <span className="inline-flex items-center gap-2 rounded-full bg-info-soft px-3 py-1.5 text-[12px] font-bold text-text-dark">
                  {isCargo ? <Package size={14} /> : <Users size={14} />}
                  {isCargo ? "Cargo flight" : "Passenger flight"}
                </span>
              }
            >
              {isCargo ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Cargo manifest" required>
                      <Input
                        value={form.cargoManifest}
                        onChange={(e) => setField("cargoManifest", e.target.value)}
                        placeholder="CGO-MAN-125-001"
                      />
                    </Field>
                    <Field label="Air waybill" required>
                      <Input
                        value={form.airWaybill}
                        onChange={(e) => setField("airWaybill", e.target.value)}
                        placeholder="AWB-176-00125"
                      />
                    </Field>
                    <Field label="Shipper / consignor" required>
                      <Input
                        value={form.shipper}
                        onChange={(e) => setField("shipper", e.target.value)}
                        placeholder="Gulf Freight Forwarders"
                      />
                    </Field>
                    <Field label="Consignee" required>
                      <Input
                        value={form.consignee}
                        onChange={(e) => setField("consignee", e.target.value)}
                        placeholder="Nairobi Cargo Terminal"
                      />
                    </Field>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-border-soft bg-surface-muted px-4 py-3">
                    <Info size={16} className="mt-0.5 shrink-0 text-accent" />
                    <p className="text-[12px] text-text-muted">
                      Supporting documents — dangerous goods declarations, cargo security
                      declarations and operator consignment notes — must accompany the air waybill
                      and be uploaded against the cargo manifest before clearance.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Passenger manifest" required>
                      <Input
                        value={form.passengerManifest}
                        onChange={(e) => setField("passengerManifest", e.target.value)}
                        placeholder="PAX-MAN-125-001"
                      />
                    </Field>
                    <Field label="Receiving party" required>
                      <Input
                        value={form.receivingParty}
                        onChange={(e) => setField("receivingParty", e.target.value)}
                        placeholder="Global Wings Ops Control"
                      />
                    </Field>
                    <Field label="Receiving party contact" className="sm:col-span-2">
                      <Input
                        value={form.receivingPartyContact}
                        onChange={(e) => setField("receivingPartyContact", e.target.value)}
                        placeholder="+971 4 555 0125"
                      />
                    </Field>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-border-soft bg-surface-muted px-4 py-3">
                    <Info size={16} className="mt-0.5 shrink-0 text-accent" />
                    <p className="text-[12px] text-text-muted">
                      The passenger manifest and receiving party contact are used by the authority
                      for border and handling coordination. Name changes after submission require a
                      revision request.
                    </p>
                  </div>
                </div>
              )}
            </SectionCard>
          ) : null}

          {step === 5 ? (
            <SectionCard
              title="Route & Schedule"
              description="Departure, routing and the planned time window."
            >
              <div className="mb-4 rounded-xl border border-border-soft bg-info-soft px-4 py-3 text-[13px] font-semibold text-text-dark">
                {form.origin} ({form.originIcao}) → {form.destination} ({form.destinationIcao})
                <span className="ml-2 font-normal text-text-muted">
                  Entry {form.entryPoint} · Exit {form.exitPoint} · {formatDate(form.departureAt)}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Origin" required>
                  <Input value={form.origin} onChange={(e) => setField("origin", e.target.value)} />
                </Field>
                <Field label="Origin ICAO" required>
                  <Input
                    value={form.originIcao}
                    onChange={(e) => setField("originIcao", e.target.value.toUpperCase())}
                  />
                </Field>
                <Field label="Destination" required>
                  <Input
                    value={form.destination}
                    onChange={(e) => setField("destination", e.target.value)}
                  />
                </Field>
                <Field label="Destination ICAO" required>
                  <Input
                    value={form.destinationIcao}
                    onChange={(e) => setField("destinationIcao", e.target.value.toUpperCase())}
                  />
                </Field>
                <Field label="Entry point" required>
                  <Input
                    value={form.entryPoint}
                    onChange={(e) => setField("entryPoint", e.target.value)}
                  />
                </Field>
                <Field label="Exit point" required>
                  <Input
                    value={form.exitPoint}
                    onChange={(e) => setField("exitPoint", e.target.value)}
                  />
                </Field>
                <Field label="Departure (UTC)" required>
                  <Input
                    value={form.departureAt}
                    onChange={(e) => setField("departureAt", e.target.value)}
                    placeholder="2026-10-15T08:30:00.000Z"
                  />
                </Field>
                <Field label="Arrival (UTC)" required>
                  <Input
                    value={form.arrivalAt}
                    onChange={(e) => setField("arrivalAt", e.target.value)}
                    placeholder="2026-10-15T13:15:00.000Z"
                  />
                </Field>
                <Field label="Estimated entry (UTC)" hint="Overflight boundary entry time.">
                  <Input
                    value={form.estimatedEntryAt}
                    onChange={(e) => setField("estimatedEntryAt", e.target.value)}
                    placeholder="2026-10-15T10:45:00.000Z"
                  />
                </Field>
                <Field label="Estimated exit (UTC)" hint="Overflight boundary exit time.">
                  <Input
                    value={form.estimatedExitAt}
                    onChange={(e) => setField("estimatedExitAt", e.target.value)}
                    placeholder="2026-10-15T11:30:00.000Z"
                  />
                </Field>
              </div>

              {isLanding ? (
                <div className="mt-5 space-y-4 border-t border-border-soft pt-5">
                  <div className="flex items-center gap-2 text-[12px] font-bold text-text-dark">
                    <Plane size={15} className="text-accent" /> Landing-specific details
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Departure slot" hint="Coordinated airport departure slot.">
                      <Input
                        value={form.departureSlot}
                        onChange={(e) => setField("departureSlot", e.target.value)}
                        placeholder="SLOT-OMDB-0815"
                      />
                    </Field>
                    <Field label="Arrival slot" hint="Coordinated airport arrival slot.">
                      <Input
                        value={form.arrivalSlot}
                        onChange={(e) => setField("arrivalSlot", e.target.value)}
                        placeholder="SLOT-HKJK-1305"
                      />
                    </Field>
                    <Field label="Ground handling agent">
                      <Input
                        value={form.groundHandlingAgent}
                        onChange={(e) => setField("groundHandlingAgent", e.target.value)}
                        placeholder="Pwani Ground Services"
                      />
                    </Field>
                    <Field label="Purpose of visit">
                      <Input
                        value={form.purposeOfVisit}
                        onChange={(e) => setField("purposeOfVisit", e.target.value)}
                        placeholder="Scheduled passenger service"
                      />
                    </Field>
                  </div>
                </div>
              ) : (
                <div className="mt-5 flex items-start gap-3 rounded-xl border border-border-soft bg-info-soft px-4 py-3">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-status-awaiting" />
                  <p className="text-[12px] text-text-muted">
                    Overflight authorisation covers entry and exit of the flight information region
                    only. Route validation confirms both boundary points fall on published air
                    routes; no landing, slot or ground handling detail is required.
                  </p>
                </div>
              )}
            </SectionCard>
          ) : null}

          {step === 6 ? (
            <SectionCard
              title="Documents"
              description="Required documents are attached from your verified document centre."
              actions={
                <Button variant="outline" onClick={() => handleUpload("Required documents")}>
                  <Upload size={15} /> Upload
                </Button>
              }
            >
              <ul className="space-y-2">
                {applicationDocuments.map((document) => (
                  <li
                    key={document.id}
                    className="flex items-center justify-between gap-4 rounded-lg border border-border-soft bg-surface px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-text-dark">
                        {document.name}
                      </p>
                      <p className="text-[12px] text-text-subtle">
                        {document.reference} · v{document.version} · expires{" "}
                        {formatDate(document.expiry)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <DocumentStatusBadge status={document.status} />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpload(document.name)}
                      >
                        Replace
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>

              {requiresSpecialDocuments ? (
                <div className="mt-4 rounded-xl border border-status-awaiting/30 bg-warning-soft px-4 py-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="mt-0.5 shrink-0 text-status-awaiting" />
                    <div>
                      <p className="text-[13px] font-bold text-text-dark">
                        Additional documents required
                      </p>
                      <p className="mt-1 text-[12px] text-text-muted">
                        The selected flight category &mdash; {form.category} &mdash; is classed as a
                        special nature operation. Additional documents apply beyond the standard
                        checklist and must be uploaded before the application can clear review:
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-[12px] text-text-muted">
                        <li>Authority special-purpose authorisation or endorsement</li>
                        <li>
                          Category-specific declaration (medical, humanitarian, diplomatic or SAR)
                        </li>
                        <li>
                          Supporting clearance from the relevant coordinating ministry or agency
                        </li>
                      </ul>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => handleUpload(`${form.category} additional documents`)}
                      >
                        <Upload size={14} /> Upload additional documents
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              {isCargo ? (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-border-soft bg-surface-muted px-4 py-3">
                  <Package size={16} className="mt-0.5 shrink-0 text-accent" />
                  <p className="text-[12px] text-text-muted">
                    Cargo flights must attach the air waybill, cargo manifest and, where applicable,
                    a dangerous goods declaration before clearance.
                  </p>
                </div>
              ) : null}
            </SectionCard>
          ) : null}

          {step === 7 ? (
            <SectionCard
              title="Validation"
              description="Automated checks run against the operator, aircraft, route and documents."
              actions={
                <Button variant="outline" onClick={handleRunValidation}>
                  <RefreshCw size={15} /> Run validation
                </Button>
              }
            >
              <div
                className={cn(
                  "mb-4 flex items-center gap-3 rounded-xl border px-4 py-3",
                  validationBannerClasses(application.validationResult),
                )}
              >
                {application.validationResult === "PASS" ? (
                  <BadgeCheck
                    size={20}
                    className={validationIconClasses(application.validationResult)}
                  />
                ) : (
                  <AlertTriangle
                    size={20}
                    className={validationIconClasses(application.validationResult)}
                  />
                )}
                <div>
                  <p className="text-[13px] font-bold text-text-dark">
                    Overall result: {application.validationResult}
                  </p>
                  <p className="text-[12px] text-text-muted">
                    {application.validation.filter((check) => check.outcome === "PASS").length} of{" "}
                    {application.validation.length} checks passed.
                  </p>
                </div>
              </div>
              <Checklist
                items={application.validation.map((check) => ({
                  id: check.id,
                  label: check.label,
                  detail: check.detail,
                  outcome: check.outcome,
                }))}
              />
            </SectionCard>
          ) : null}

          {step === 8 ? (
            <SectionCard
              title="Payment"
              description="Settle the permit and processing fees to complete the application."
            >
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border-soft pb-2">
                    <span className="text-[13px] text-text-muted">Permit fee</span>
                    <span className="text-[13px] font-semibold text-text-dark">
                      {currency} {permitFee.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border-soft pb-2">
                    <span className="text-[13px] text-text-muted">Processing fee</span>
                    <span className="text-[13px] font-semibold text-text-dark">
                      {currency} {processingFee.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-bold text-text-dark">Total payable</span>
                    <span className="text-[18px] font-extrabold text-primary">
                      {currency} {total.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-surface-muted px-3.5 py-2.5">
                    <span className="text-[12px] font-semibold text-text-muted">
                      Wallet balance
                    </span>
                    <span className="text-[13px] font-bold text-text-dark">
                      {wallet.currency} {wallet.balance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3.5">
                    <span className="text-[12px] text-text-subtle">Remaining after payment</span>
                    <span className="text-[13px] font-semibold text-text-dark">
                      {wallet.currency} {remainingBalance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <PaymentBadge status={paymentStatus} />
                    <ClearanceBadge status={clearance} />
                  </div>
                </div>

                <div className="space-y-3">
                  {isPaid ? (
                    <div className="flex items-start gap-3 rounded-xl border border-status-cleared/30 bg-success-soft px-4 py-3">
                      <BadgeCheck size={18} className="mt-0.5 shrink-0 text-status-cleared" />
                      <div>
                        <p className="text-[13px] font-bold text-text-dark">Fees paid</p>
                        <p className="mt-0.5 text-[12px] text-text-muted">
                          {currency} {total.toLocaleString()} settled
                          {storedPaymentMethod ? ` via ${storedPaymentMethod}` : ""}. Payment
                          options are disabled because this application is already paid.
                        </p>
                      </div>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    disabled={isPaid}
                    onClick={() => handlePay("wallet")}
                    className={cn(
                      optionClass(storedPaymentMethod === "Advance Deposit / Wallet"),
                      isPaid &&
                        "cursor-not-allowed opacity-60 hover:border-border-soft hover:bg-surface",
                    )}
                  >
                    <span className="flex items-center gap-2 text-[13px] font-bold text-text-dark">
                      <Wallet size={16} className="text-accent" /> Advance Deposit / Wallet
                    </span>
                    <span className="mt-1 text-[12px] text-text-muted">
                      Debit the {currency} {total.toLocaleString()} fee from your authorised
                      operator wallet.
                    </span>
                    <span className="mt-3 inline-flex w-fit items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground">
                      Pay from wallet
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={isPaid}
                    onClick={() => handlePay("online")}
                    className={cn(
                      optionClass(storedPaymentMethod === "Online Payment"),
                      isPaid &&
                        "cursor-not-allowed opacity-60 hover:border-border-soft hover:bg-surface",
                    )}
                  >
                    <span className="flex items-center gap-2 text-[13px] font-bold text-text-dark">
                      <CreditCard size={16} className="text-accent" /> Online Payment (demo)
                    </span>
                    <span className="mt-1 text-[12px] text-text-muted">
                      Card / bank transfer simulation. No real payment is taken in this
                      demonstration.
                    </span>
                    <span className="mt-3 inline-flex w-fit items-center gap-2 rounded-md bg-accent px-3 py-1.5 text-[12px] font-bold text-accent-foreground">
                      Pay Now
                    </span>
                  </button>
                </div>
              </div>
            </SectionCard>
          ) : null}

          {step === 9 ? (
            <div className="space-y-5">
              <SectionCard title="Operator" description="Applicant on record.">
                <DescriptionList
                  columns={3}
                  items={[
                    { label: "Company", value: operator.company },
                    { label: "Operator ID", value: operator.operatorId },
                    { label: "Country", value: operator.country },
                    { label: "AOC number", value: operator.aocNumber },
                    { label: "AOC valid until", value: formatDate(operator.aocValidUntil) },
                    { label: "KYC status", value: operator.kycStatus },
                  ]}
                />
              </SectionCard>

              <SectionCard title="Aircraft" description="Airframe assigned to this application.">
                <DescriptionList
                  columns={3}
                  items={[
                    { label: "Registration", value: heroAircraft?.registration ?? "—" },
                    { label: "Type", value: heroAircraft?.type ?? "—" },
                    {
                      label: "MTOW",
                      value: heroAircraft ? `${heroAircraft.mtowKg.toLocaleString()} kg` : "—",
                    },
                  ]}
                />
              </SectionCard>

              <SectionCard title="Flight" description="Category and flight detail.">
                <DescriptionList
                  columns={3}
                  items={[
                    { label: "Authorization", value: form.authorization },
                    { label: "Permit kind", value: form.permitKind },
                    { label: "Category", value: form.category },
                    { label: "Flight number", value: form.flightNumber },
                    { label: "Call sign", value: form.callSign },
                    { label: "Passengers", value: form.passengerCount },
                    { label: "Cargo", value: form.cargo },
                    { label: "Purpose", value: form.purpose, fullWidth: true },
                    {
                      label: "Special information",
                      value: form.specialInfo || "—",
                      fullWidth: true,
                    },
                  ]}
                />
              </SectionCard>

              <SectionCard
                title={isCargo ? "Cargo detail" : "PAX detail"}
                description="Nature-specific manifest detail for this flight."
              >
                {isCargo ? (
                  <DescriptionList
                    columns={3}
                    items={[
                      { label: "Cargo manifest", value: form.cargoManifest || "—" },
                      { label: "Air waybill", value: form.airWaybill || "—" },
                      { label: "Shipper / consignor", value: form.shipper || "—" },
                      { label: "Consignee", value: form.consignee || "—" },
                    ]}
                  />
                ) : (
                  <DescriptionList
                    columns={3}
                    items={[
                      { label: "Passenger manifest", value: form.passengerManifest || "—" },
                      { label: "Receiving party", value: form.receivingParty || "—" },
                      {
                        label: "Receiving party contact",
                        value: form.receivingPartyContact || "—",
                      },
                    ]}
                  />
                )}
              </SectionCard>

              <SectionCard
                title="Route & Schedule"
                description="Authorised routing and time window."
              >
                <DescriptionList
                  columns={3}
                  items={[
                    { label: "Origin", value: `${form.origin} (${form.originIcao})` },
                    {
                      label: "Destination",
                      value: `${form.destination} (${form.destinationIcao})`,
                    },
                    { label: "Entry point", value: form.entryPoint },
                    { label: "Exit point", value: form.exitPoint },
                    { label: "Departure (UTC)", value: formatDate(form.departureAt) },
                    { label: "Arrival (UTC)", value: formatDate(form.arrivalAt) },
                    {
                      label: "Estimated entry (UTC)",
                      value: form.estimatedEntryAt ? formatDate(form.estimatedEntryAt) : "—",
                    },
                    {
                      label: "Estimated exit (UTC)",
                      value: form.estimatedExitAt ? formatDate(form.estimatedExitAt) : "—",
                    },
                    ...(isLanding
                      ? [
                          { label: "Departure slot", value: form.departureSlot || "—" },
                          { label: "Arrival slot", value: form.arrivalSlot || "—" },
                          {
                            label: "Ground handling agent",
                            value: form.groundHandlingAgent || "—",
                          },
                          { label: "Purpose of visit", value: form.purposeOfVisit || "—" },
                        ]
                      : []),
                  ]}
                />
              </SectionCard>

              <SectionCard
                title="Documents"
                description={`${applicationDocuments.length} documents attached.`}
              >
                <ul className="space-y-2">
                  {applicationDocuments.map((document) => (
                    <li
                      key={document.id}
                      className="flex items-center justify-between gap-4 rounded-lg border border-border-soft px-4 py-2.5"
                    >
                      <span className="text-[13px] font-medium text-text-dark">
                        {document.name}
                      </span>
                      <DocumentStatusBadge status={document.status} />
                    </li>
                  ))}
                </ul>
              </SectionCard>

              <SectionCard title="Validation" description="Automated compliance checks.">
                <div
                  className={cn(
                    "mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-bold",
                    validationBannerClasses(application.validationResult),
                    validationIconClasses(application.validationResult),
                  )}
                >
                  <FileCheck2 size={14} /> Overall {application.validationResult}
                </div>
                <Checklist
                  items={application.validation.map((check) => ({
                    id: check.id,
                    label: check.label,
                    detail: check.detail,
                    outcome: check.outcome,
                  }))}
                />
              </SectionCard>

              <SectionCard title="Financial" description="Fees and settlement status.">
                <div className="mb-4 flex items-center gap-2">
                  <PaymentBadge status={paymentStatus} />
                  <ClearanceBadge status={clearance} />
                  <ValidationBadge outcome={application.validationResult} />
                </div>
                <DescriptionList
                  columns={3}
                  items={[
                    { label: "Permit fee", value: `${currency} ${permitFee.toLocaleString()}` },
                    {
                      label: "Processing fee",
                      value: `${currency} ${processingFee.toLocaleString()}`,
                    },
                    { label: "Total", value: `${currency} ${total.toLocaleString()}` },
                    { label: "Payment method", value: storedPaymentMethod ?? "Not selected" },
                    { label: "Payment status", value: paymentStatus },
                    { label: "Clearance", value: clearance },
                  ]}
                />
              </SectionCard>
            </div>
          ) : null}

          <ActionBar className="rounded-xl border border-border-soft">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={goBack} disabled={step === 0}>
                Back
              </Button>
              <Button variant="ghost" onClick={handleSaveDraft}>
                <Save size={15} /> Save draft
              </Button>
            </div>
            {step < STEPS.length - 1 ? (
              <Button onClick={goNext}>Continue</Button>
            ) : (
              <Button onClick={handleSubmit}>
                <CheckCircle2 size={15} /> Submit application
              </Button>
            )}
          </ActionBar>
        </div>
      </div>
    </PortalPage>
  );
}
