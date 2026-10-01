import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CreditCard,
  FileClock,
  FilePlus,
  Plane,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import {
  ApplicationStatusBadge,
  DataTable,
  KpiTile,
  PortalPage,
  SectionCard,
  StatusBadge,
  type Column,
} from "@/components/desktop";
import type { ApplicationRecord, ApplicationStatus, DocumentStatus } from "@/data/types";
import { getAircraft } from "@/data/lookups";
import {
  formatDate,
  formatDateTime,
  useClockIso,
  useDocuments,
  useNotifications,
  useOperator,
  useOperatorApplications,
  usePermits,
  useWallet,
  useWorld,
} from "@/store";

export const Route = createFileRoute("/operator/dashboard")({
  component: DashboardScreen,
});

const PENDING_STATUSES: readonly ApplicationStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "UNDER REVIEW",
  "AWAITING FINANCE",
  "TECHNICAL REVIEW",
  "AWAITING FINAL APPROVAL",
  "REVISION REQUESTED",
  "RETURNED",
];

const APPROVED_STATUSES: readonly ApplicationStatus[] = ["APPROVED", "ISSUED", "REISSUED"];
const ATTENTION_DOCUMENT_STATUSES: readonly DocumentStatus[] = [
  "EXPIRING SOON",
  "EXPIRED",
  "REJECTED",
  "MISSING",
];

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

const NOTIFICATION_ICON: Record<string, LucideIcon> = {
  DOCUMENT: FileClock,
  APPLICATION: FileClock,
  PAYMENT: CreditCard,
  APPROVAL: CheckCircle2,
  PERMIT: ShieldCheck,
};

function DashboardScreen() {
  const navigate = useNavigate();
  const world = useWorld();
  const operator = useOperator();
  const applications = useOperatorApplications();
  const documents = useDocuments();
  const permits = usePermits();
  const wallet = useWallet();
  const clockIso = useClockIso();
  const notifications = useNotifications("operator");

  const operatorAircraftIds = new Set(
    world.aircraft.filter((item) => item.operatorId === operator.id).map((item) => item.id),
  );
  const operatorApplicationIds = new Set(applications.map((item) => item.id));

  const ownedDocuments = documents.filter((document) => {
    if (document.ownerType === "operator") return document.ownerId === operator.id;
    if (document.ownerType === "aircraft") return operatorAircraftIds.has(document.ownerId);
    return operatorApplicationIds.has(document.ownerId);
  });

  const activePermits = permits.filter(
    (permit) =>
      permit.operatorId === operator.id &&
      (permit.status === "ISSUED" || permit.status === "ACTIVE" || permit.status === "REISSUED"),
  ).length;

  const pendingApplications = applications.filter((application) =>
    PENDING_STATUSES.includes(application.status),
  ).length;

  const approvedApplications = applications.filter((application) =>
    APPROVED_STATUSES.includes(application.status),
  ).length;

  const upcomingFlights = applications.filter(
    (application) =>
      new Date(application.route.departureAt).getTime() > new Date(clockIso).getTime(),
  ).length;

  const expiringDocuments = ownedDocuments.filter((document) =>
    ATTENTION_DOCUMENT_STATUSES.includes(document.status),
  ).length;

  const recentApplications = [...applications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const recentNotifications = [...notifications]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 4);

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
      key: "aircraft",
      header: "Aircraft",
      cell: (application) => getAircraft(world, application.aircraftId).registration,
    },
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

  return (
    <PortalPage
      title="Operator Dashboard"
      description={`Welcome back, ${operator.company}. Here is the current state of your permits and applications.`}
      breadcrumb={[{ label: "Operator" }, { label: "Dashboard" }]}
      actions={
        <button
          type="button"
          onClick={() => navigate({ to: "/operator/apply" })}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-accent-foreground transition-colors hover:bg-accent-pressed"
        >
          <FilePlus size={15} /> Apply for Permit
        </button>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <KpiTile
            label="Active Permits"
            value={activePermits}
            hint="Issued and currently valid"
            icon={ShieldCheck}
            tone="success"
            onClick={() => navigate({ to: "/operator/permits" })}
          />
          <KpiTile
            label="Pending Applications"
            value={pendingApplications}
            hint="Moving through the workflow"
            icon={FileClock}
            tone="warning"
            onClick={() => navigate({ to: "/operator/applications" })}
          />
          <KpiTile
            label="Approved Applications"
            value={approvedApplications}
            hint="Approved or issued"
            icon={CheckCircle2}
            tone="info"
            onClick={() => navigate({ to: "/operator/applications" })}
          />
          <KpiTile
            label="Upcoming Flights"
            value={upcomingFlights}
            hint="Departing after the current time"
            icon={Plane}
            tone="info"
            onClick={() => navigate({ to: "/operator/applications" })}
          />
          <KpiTile
            label="Expiring Documents"
            value={expiringDocuments}
            hint="Expiring soon or requiring attention"
            icon={AlertTriangle}
            tone={expiringDocuments > 0 ? "danger" : "default"}
            onClick={() => navigate({ to: "/operator/documents" })}
          />
          <KpiTile
            label="Outstanding Payment"
            value={formatMoney(wallet.outstanding, wallet.currency)}
            hint={`Wallet balance ${formatMoney(wallet.balance, wallet.currency)}`}
            icon={CreditCard}
            tone={wallet.outstanding > 0 ? "warning" : "default"}
            onClick={() => navigate({ to: "/operator/payments" })}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <SectionCard
              title="Recent applications"
              description="Your latest permit applications and their current stage."
              actions={
                <Link
                  to="/operator/applications"
                  className="text-[12px] font-semibold text-accent hover:underline"
                >
                  View all
                </Link>
              }
              padded={false}
            >
              <DataTable
                columns={columns}
                rows={recentApplications}
                getRowKey={(application) => application.id}
                onRowClick={(application) =>
                  navigate({
                    to: "/operator/applications/$reference",
                    params: { reference: application.reference },
                  })
                }
                emptyTitle="No applications yet"
                emptyDescription="Start a new permit application to see it tracked here."
              />
            </SectionCard>
          </div>

          <SectionCard
            title="Notifications"
            description="Recent activity on your account."
            actions={
              <Link
                to="/operator/notifications"
                className="text-[12px] font-semibold text-accent hover:underline"
              >
                View all
              </Link>
            }
          >
            {recentNotifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Bell size={20} className="text-text-subtle" />
                <p className="text-[12px] text-text-muted">No notifications.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {recentNotifications.map((notification) => {
                  const Icon = NOTIFICATION_ICON[notification.type] ?? Bell;
                  return (
                    <li key={notification.id} className="flex gap-3">
                      <span
                        className={
                          notification.read
                            ? "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-text-subtle"
                            : "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-info-soft text-accent"
                        }
                      >
                        <Icon size={15} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wide text-text-subtle">
                            {notification.type}
                          </span>
                          {!notification.read ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-[12.5px] font-medium text-text-dark">
                          {notification.text}
                        </p>
                        <p className="mt-0.5 text-[11px] text-text-subtle">
                          {formatDateTime(notification.time)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </div>

        <SectionCard
          title="Wallet & clearance"
          description="Advance deposit balance used to settle permit fees."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-text-subtle">
                Wallet balance
              </div>
              <div className="mt-1 text-[20px] font-extrabold text-text-dark">
                {formatMoney(wallet.balance, wallet.currency)}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-text-subtle">
                Outstanding
              </div>
              <div className="mt-1 text-[20px] font-extrabold text-text-dark">
                {formatMoney(wallet.outstanding, wallet.currency)}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-text-subtle">
                Financial standing
              </div>
              <div className="mt-1">
                <StatusBadge
                  label={wallet.outstanding > 0 ? "Payment due" : "In good standing"}
                  tone={wallet.outstanding > 0 ? "awaiting" : "cleared"}
                />
              </div>
            </div>
          </div>
          <p className="mt-4 text-[11px] text-text-subtle">
            Fees are quoted in {wallet.currency}. Last reviewed {formatDate(clockIso)}.
          </p>
        </SectionCard>
      </div>
    </PortalPage>
  );
}
