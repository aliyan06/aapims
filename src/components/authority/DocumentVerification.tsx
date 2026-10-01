import { useState } from "react";
import { FileCheck2, FileWarning, MessageSquarePlus, RefreshCw, ShieldAlert } from "lucide-react";
import {
  DataTable,
  DescriptionList,
  DocumentStatusBadge,
  Drawer,
  Field,
  SectionCard,
  type Column,
} from "@/components/desktop";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getApplication, getDocument } from "@/data/lookups";
import type { DocumentRecord } from "@/data/types";
import { formatDate, useAppStore, useDocuments, usePermission, useWorld } from "@/store";

type DocumentVerificationProps = {
  applicationId: string;
};

/**
 * Authority document verification (features.md §8). Records a reviewer comment
 * against each attached document via Verify / Reject / Request Replacement /
 * Add Observation. Acting requires the `doc.verify` permission.
 */
export function DocumentVerification({ applicationId }: DocumentVerificationProps) {
  const world = useWorld();
  const documents = useDocuments();
  const canVerify = usePermission("doc.verify");

  const verifyDocument = useAppStore((s) => s.verifyDocument);
  const rejectDocument = useAppStore((s) => s.rejectDocument);
  const requestDocumentReplacement = useAppStore((s) => s.requestDocumentReplacement);
  const addDocumentObservation = useAppStore((s) => s.addDocumentObservation);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const application = getApplication(world, applicationId);
  const applicationDocuments = application.documentIds.map((id) => getDocument(world, id));
  const selectedDocument = selectedId ? getDocument(world, selectedId) : null;

  function openDocument(document: DocumentRecord) {
    setSelectedId(document.id);
    setComment(document.reviewerComment ?? "");
  }

  function closeDocument() {
    setSelectedId(null);
    setComment("");
  }

  function runAction(action: (documentId: string, comment: string) => boolean) {
    if (!selectedDocument) return;
    const trimmed = comment.trim();
    if (action(selectedDocument.id, trimmed)) {
      closeDocument();
    }
  }

  const columns: Column<DocumentRecord>[] = [
    {
      key: "name",
      header: "Document",
      cell: (document) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-text-dark">{document.name}</div>
          {document.reviewerComment ? (
            <div className="mt-1.5 rounded-md border border-border-soft bg-surface-muted px-2 py-1 text-[11px] leading-snug text-text-muted">
              <span className="font-semibold text-text-dark">Reviewer: </span>
              {document.reviewerComment}
              {document.verifiedBy ? (
                <span className="text-text-subtle"> · {document.verifiedBy}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (document) => <span className="text-text-muted">{document.category}</span>,
    },
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
      align: "center",
      cell: (document) => `v${document.version}`,
    },
    {
      key: "reference",
      header: "Reference",
      cell: (document) => <span className="text-text-muted">{document.reference}</span>,
    },
    {
      key: "actions",
      header: "Action",
      align: "right",
      cell: (document) => (
        <Button variant="outline" size="sm" onClick={() => openDocument(document)}>
          Review
        </Button>
      ),
    },
  ];

  const totalDocuments = documents.filter((document) =>
    application.documentIds.includes(document.id),
  ).length;

  return (
    <SectionCard
      title="Documents"
      description={`${totalDocuments} documents attached — verify each document and record a reviewer comment.`}
      padded={false}
    >
      <DataTable
        columns={columns}
        rows={applicationDocuments}
        getRowKey={(document) => document.id}
        emptyTitle="No documents attached"
        emptyDescription="This application has no documents on record to verify."
      />

      <Drawer
        open={selectedDocument !== null}
        onClose={closeDocument}
        title={selectedDocument?.name ?? "Document"}
        description={`Reviewer verification — ${application.reference}`}
        footer={
          selectedDocument ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                variant="outline"
                disabled={!canVerify}
                onClick={() => runAction(requestDocumentReplacement)}
              >
                <RefreshCw size={15} /> Request Replacement
              </Button>
              <Button
                variant="outline"
                disabled={!canVerify}
                onClick={() => runAction(addDocumentObservation)}
              >
                <MessageSquarePlus size={15} /> Add Observation
              </Button>
              <Button
                variant="outline"
                className="text-status-rejected"
                disabled={!canVerify}
                onClick={() => runAction(rejectDocument)}
              >
                <FileWarning size={15} /> Reject
              </Button>
              <Button disabled={!canVerify} onClick={() => runAction(verifyDocument)}>
                <FileCheck2 size={15} /> Verify
              </Button>
            </div>
          ) : null
        }
      >
        {selectedDocument ? (
          <div className="space-y-5">
            <DescriptionList
              columns={2}
              items={[
                { label: "Category", value: selectedDocument.category },
                {
                  label: "Status",
                  value: <DocumentStatusBadge status={selectedDocument.status} />,
                },
                { label: "Expiry", value: formatDate(selectedDocument.expiry) },
                { label: "Version", value: `v${selectedDocument.version}` },
                { label: "Reference", value: selectedDocument.reference },
                {
                  label: "Uploaded",
                  value: formatDate(selectedDocument.uploadedAt),
                },
                {
                  label: "Verified by",
                  value: selectedDocument.verifiedBy ?? "Not yet reviewed",
                  fullWidth: true,
                },
              ]}
            />

            {!canVerify ? (
              <div className="flex items-start gap-3 rounded-lg border border-border-soft bg-warning-soft/40 px-3.5 py-3">
                <ShieldAlert size={18} className="mt-0.5 shrink-0 text-status-awaiting" />
                <p className="text-[12.5px] text-text-muted">
                  Read-only: your role does not hold the document verification permission. Actions
                  are disabled.
                </p>
              </div>
            ) : null}

            <Field
              label="Reviewer comment"
              hint="Recorded against this document and written to the audit trail."
            >
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Describe what was checked or what the operator must do next."
                disabled={!canVerify}
                rows={4}
              />
            </Field>
          </div>
        ) : null}
      </Drawer>
    </SectionCard>
  );
}
