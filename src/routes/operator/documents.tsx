import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, RefreshCw, Upload, Eye } from "lucide-react";
import {
  DataTable,
  DocumentStatusBadge,
  PortalPage,
  SectionCard,
  UnderlineTabs,
  type Column,
} from "@/components/desktop";
import { Button } from "@/components/ui/button";
import type { DocumentRecord, DocumentStatus } from "@/data/types";
import { formatDate, useAppStore, useDocuments, useOperator, useWorld } from "@/store";

export const Route = createFileRoute("/operator/documents")({
  component: DocumentsScreen,
});

const TAB_KEYS = ["all", "valid", "expiring", "attention"] as const;
type TabKey = (typeof TAB_KEYS)[number];

const EXPIRING: readonly DocumentStatus[] = ["EXPIRING SOON"];
const ATTENTION: readonly DocumentStatus[] = [
  "EXPIRED",
  "REJECTED",
  "MISSING",
  "PENDING VERIFICATION",
];

function matchesTab(document: DocumentRecord, tab: TabKey): boolean {
  switch (tab) {
    case "all":
      return true;
    case "valid":
      return document.status === "VALID";
    case "expiring":
      return EXPIRING.includes(document.status);
    case "attention":
      return ATTENTION.includes(document.status);
    default:
      return true;
  }
}

function DocumentsScreen() {
  const world = useWorld();
  const operator = useOperator();
  const documents = useDocuments();
  const pushToast = useAppStore((s) => s.pushToast);
  const [tab, setTab] = useState<TabKey>("all");

  const operatorAircraftIds = new Set(
    world.aircraft.filter((item) => item.operatorId === operator.id).map((item) => item.id),
  );
  const operatorApplicationIds = new Set(
    world.applications.filter((item) => item.operatorId === operator.id).map((item) => item.id),
  );

  const owned = documents.filter((document) => {
    if (document.ownerType === "operator") return document.ownerId === operator.id;
    if (document.ownerType === "aircraft") return operatorAircraftIds.has(document.ownerId);
    return operatorApplicationIds.has(document.ownerId);
  });

  const rows = owned.filter((document) => matchesTab(document, tab));

  function mockAction(label: string, document: DocumentRecord) {
    pushToast({
      title: `${label} · ${document.name}`,
      description: "This action is disabled in the demonstration environment.",
      tone: "info",
    });
  }

  const columns: Column<DocumentRecord>[] = [
    {
      key: "name",
      header: "Document",
      cell: (document) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-text-muted">
            <FileText size={15} />
          </span>
          <div className="min-w-0">
            <div className="truncate font-semibold text-text-dark">{document.name}</div>
            <div className="truncate text-[11px] text-text-subtle">{document.reference}</div>
          </div>
        </div>
      ),
    },
    { key: "category", header: "Category", cell: (document) => document.category },
    {
      key: "status",
      header: "Status",
      cell: (document) => <DocumentStatusBadge status={document.status} />,
    },
    {
      key: "expiry",
      header: "Expiry",
      cell: (document) => formatDate(document.expiry),
    },
    {
      key: "version",
      header: "Version",
      cell: (document) => `v${document.version}`,
    },
    {
      key: "action",
      header: "",
      align: "right",
      cell: (document) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button variant="ghost" size="sm" onClick={() => mockAction("View", document)}>
            <Eye size={14} /> View
          </Button>
          <Button variant="outline" size="sm" onClick={() => mockAction("Replace", document)}>
            <RefreshCw size={14} /> Replace
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PortalPage
      title="Document Centre"
      description="Operator, aircraft and application documents held on file, with validity status."
      breadcrumb={[{ label: "Operator" }, { label: "Documents" }]}
      actions={
        <Button
          onClick={() =>
            pushToast({
              title: "Upload document",
              description: "File upload is disabled in the demonstration environment.",
              tone: "info",
            })
          }
        >
          <Upload size={15} /> Upload
        </Button>
      }
      tabs={
        <UnderlineTabs
          value={tab}
          onChange={(key) => setTab(key as TabKey)}
          tabs={[
            { key: "all", label: "All", count: owned.length },
            {
              key: "valid",
              label: "Valid",
              count: owned.filter((document) => matchesTab(document, "valid")).length,
            },
            {
              key: "expiring",
              label: "Expiring soon",
              count: owned.filter((document) => matchesTab(document, "expiring")).length,
            },
            {
              key: "attention",
              label: "Needs attention",
              count: owned.filter((document) => matchesTab(document, "attention")).length,
            },
          ]}
        />
      }
    >
      <SectionCard padded={false}>
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(document) => document.id}
          emptyTitle="No documents in this view"
          emptyDescription="Upload documents to keep your permit applications moving."
        />
      </SectionCard>
    </PortalPage>
  );
}
