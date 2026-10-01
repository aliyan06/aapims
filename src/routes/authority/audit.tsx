import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";
import {
  DataTable,
  EmptyState,
  PortalPage,
  SectionCard,
  UnderlineTabs,
  type Column,
} from "@/components/desktop";
import { ROLE_LABEL, type Role } from "@/components/shell/roles";
import type { AuditEntry } from "@/data/types";
import { formatDateTime, useAudit } from "@/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/authority/audit")({
  component: AuditTrail,
});

const TAB_KEYS = ["all", "reviewer", "finance", "approver", "operator"] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TAB_LABELS: Record<TabKey, string> = {
  all: "All",
  reviewer: "Reviewer",
  finance: "Finance",
  approver: "Approver",
  operator: "Operator",
};

function matchesTab(entry: AuditEntry, tab: TabKey): boolean {
  return tab === "all" ? true : entry.role === tab;
}

function AuditTrail() {
  const audit = useAudit();
  const [tab, setTab] = useState<TabKey>("all");

  const sorted = useMemo(
    () => [...audit].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()),
    [audit],
  );

  const rows = sorted.filter((entry) => matchesTab(entry, tab));

  const columns: Column<AuditEntry>[] = [
    {
      key: "at",
      header: "Date / Time",
      cell: (entry) => (
        <span className="whitespace-nowrap text-text-muted">{formatDateTime(entry.at)}</span>
      ),
    },
    {
      key: "actor",
      header: "User",
      cell: (entry) => <span className="font-semibold text-text-dark">{entry.actor}</span>,
    },
    {
      key: "role",
      header: "Role",
      cell: (entry) => ROLE_LABEL[entry.role as Role] ?? entry.role,
    },
    {
      key: "action",
      header: "Action",
      cell: (entry) => entry.action,
    },
    {
      key: "reference",
      header: "Application",
      cell: (entry) => (
        <span className="font-mono text-[12px] text-text-muted">{entry.applicationReference}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (entry) => (
        <span className="inline-flex items-center rounded-full border border-border-strong bg-surface-muted px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-text-dark">
          {entry.status}
        </span>
      ),
    },
    {
      key: "change",
      header: "Change",
      cell: (entry) =>
        entry.oldValue || entry.newValue ? (
          <span className="flex items-center gap-1.5 whitespace-nowrap text-[12px]">
            <span className="text-text-subtle line-through">{entry.oldValue ?? "—"}</span>
            <span className="text-text-subtle">→</span>
            <span className="font-semibold text-text-dark">{entry.newValue ?? "—"}</span>
          </span>
        ) : (
          <span className="text-text-subtle">—</span>
        ),
    },
  ];

  return (
    <PortalPage
      title="Audit Trail"
      description="Immutable record of every workflow action taken across the permit lifecycle."
      breadcrumb={[{ label: "Authority" }, { label: "Audit Trail" }]}
      tabs={
        <UnderlineTabs
          value={tab}
          onChange={(key) => setTab(key as TabKey)}
          tabs={TAB_KEYS.map((key) => ({
            key,
            label: TAB_LABELS[key],
            count: sorted.filter((entry) => matchesTab(entry, key)).length,
          }))}
        />
      }
    >
      <SectionCard
        className={cn(rows.length === 0 && "border-0 shadow-none")}
        padded={false}
        title={rows.length > 0 ? "Recorded events" : undefined}
        description={rows.length > 0 ? "Newest first." : undefined}
      >
        {rows.length === 0 ? (
          <EmptyState
            icon={History}
            title="No audit entries"
            description="No activity has been recorded for this role yet."
          />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(entry) => entry.id}
            emptyTitle="No audit entries"
            emptyDescription="No activity has been recorded for this role yet."
          />
        )}
      </SectionCard>
    </PortalPage>
  );
}
