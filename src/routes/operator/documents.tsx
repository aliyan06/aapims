import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Eye, FileText, Info, RefreshCw, Upload } from "lucide-react";
import {
  DataTable,
  DescriptionList,
  DocumentStatusBadge,
  Drawer,
  PortalPage,
  SectionCard,
  UnderlineTabs,
  type Column,
} from "@/components/desktop";
import { Button } from "@/components/ui/button";
import type { DocumentRecord, DocumentStatus } from "@/data/types";
import {
  formatDate,
  useAppStore,
  useDocuments,
  useOperator,
  usePermission,
  useWorld,
} from "@/store";

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
  const canManage = usePermission("doc.manage");
  const [tab, setTab] = useState<TabKey>("all");
  const [selected, setSelected] = useState<DocumentRecord | null>(null);

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

  function viewDocument(document: DocumentRecord) {
    setSelected(document);
  }

  function downloadDocument(document: DocumentRecord) {
    pushToast({
      title: `Download started — ${document.name} (demo)`,
      description: "No file is transferred in the demonstration environment.",
      tone: "info",
    });
  }

  function mockManage(label: string, document: DocumentRecord) {
    pushToast({
      title: `${label} · ${document.name}`,
      description: "This action is disabled in the demonstration environment.",
      tone: "info",
    });
  }

  function mockUpload() {
    pushToast({
      title: "Upload document",
      description: "File upload is disabled in the demonstration environment.",
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
          <Button variant="ghost" size="sm" onClick={() => viewDocument(document)}>
            <Eye size={14} /> View
          </Button>
          <Button variant="ghost" size="sm" onClick={() => downloadDocument(document)}>
            <Download size={14} /> Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canManage}
            onClick={() => mockManage("Replace", document)}
          >
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
        <Button disabled={!canManage} onClick={mockUpload}>
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
      {!canManage ? (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-warning-soft bg-warning-soft/50 px-3.5 py-2.5">
          <Info size={16} className="mt-0.5 shrink-0 text-warning" />
          <p className="text-[12px] text-text-muted">
            You have read-only access to the document centre. Uploading and replacing documents
            requires the <span className="font-semibold text-text-dark">doc.manage</span>{" "}
            permission.
          </p>
        </div>
      ) : null}

      <SectionCard padded={false}>
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(document) => document.id}
          emptyTitle="No documents in this view"
          emptyDescription="Upload documents to keep your permit applications moving."
        />
      </SectionCard>

      <Drawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? "Document"}
        description={selected?.reference}
        width={560}
        footer={
          selected ? (
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setSelected(null)}>
                Close
              </Button>
              <Button variant="outline" onClick={() => downloadDocument(selected)}>
                <Download size={15} /> Download
              </Button>
              <Button disabled={!canManage} onClick={() => mockManage("Replace", selected)}>
                <RefreshCw size={15} /> Replace
              </Button>
            </div>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-5">
            <DescriptionList
              items={[
                { label: "Document name", value: selected.name, fullWidth: true },
                { label: "Category", value: selected.category },
                {
                  label: "Status",
                  value: <DocumentStatusBadge status={selected.status} />,
                },
                { label: "Expiry", value: formatDate(selected.expiry) },
                { label: "Version", value: `v${selected.version}` },
                { label: "Reference", value: selected.reference },
                { label: "Uploaded", value: formatDate(selected.uploadedAt) },
                ...(selected.verifiedBy
                  ? [{ label: "Verified by", value: selected.verifiedBy }]
                  : []),
                ...(selected.reviewerComment
                  ? [
                      {
                        label: "Reviewer comment",
                        value: selected.reviewerComment,
                        fullWidth: true,
                      },
                    ]
                  : []),
              ]}
            />

            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-text-subtle">
                Preview
              </h3>
              <div className="mt-2 rounded-xl border border-border-soft bg-surface-muted p-6">
                <div className="mx-auto max-w-sm rounded-lg border border-border-soft bg-surface px-6 py-8 text-center">
                  <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-accent">
                    <FileText size={20} />
                  </span>
                  <p className="mt-3 break-words font-semibold text-text-dark">{selected.name}</p>
                  <p className="mt-1 text-[12px] text-text-subtle">
                    {selected.reference} · v{selected.version}
                  </p>
                  <div className="mt-4 space-y-1.5">
                    <span className="block h-2 rounded-full bg-surface-muted" />
                    <span className="block h-2 rounded-full bg-surface-muted" />
                    <span className="block h-2 w-2/3 rounded-full bg-surface-muted" />
                  </div>
                  <p className="mt-4 text-[11px] uppercase tracking-wide text-text-subtle">
                    Document preview (demo)
                  </p>
                </div>
              </div>
            </div>

            {!canManage ? (
              <p className="text-[12px] text-text-muted">
                Read-only access — replacing this document requires the{" "}
                <span className="font-semibold text-text-dark">doc.manage</span> permission.
              </p>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </PortalPage>
  );
}
