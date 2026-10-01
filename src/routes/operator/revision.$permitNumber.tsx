import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FileWarning, Send } from "lucide-react";
import {
  ActionBar,
  DescriptionList,
  EmptyState,
  Field,
  PortalPage,
  SectionCard,
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
import { REVISION_TYPES, STORY_IDS, type RevisionType } from "@/data";
import { clockPlus, formatDateTime, useAppStore, useApplication, usePermit } from "@/store";

export const Route = createFileRoute("/operator/revision/$permitNumber")({
  component: RevisionRequest,
});

function RevisionRequest() {
  const { permitNumber } = Route.useParams();
  const navigate = useNavigate();
  const permit = usePermit(permitNumber);
  const application = useApplication(permit?.applicationReference ?? "");
  const requestRevision = useAppStore((s) => s.requestRevision);

  const [type, setType] = useState<RevisionType>("Date / Time Change");
  const [originalValue, setOriginalValue] = useState("");
  const [newValue, setNewValue] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!application) return;
    setOriginalValue(formatDateTime(application.route.departureAt));
    setNewValue(formatDateTime(clockPlus(application.route.departureAt, 90)));
    setReason("Operational schedule change");
  }, [application]);

  const resolvedPermitNumber = permit?.permitNumber ?? STORY_IDS.permitNumber;
  const permitId = permit?.id ?? STORY_IDS.permit;
  const knownPermit = Boolean(permit) || permitNumber === STORY_IDS.permitNumber;

  if (!knownPermit) {
    return (
      <PortalPage
        title="Request Revision"
        breadcrumb={[{ label: "Permits", to: "/operator/permits" }]}
      >
        <EmptyState
          icon={FileWarning}
          title="Unknown permit number"
          description={`No issued permit matches ${permitNumber}.`}
          action={
            <Button onClick={() => navigate({ to: "/operator/permits" })}>Back to permits</Button>
          }
        />
      </PortalPage>
    );
  }

  const handleSubmit = () => {
    const ok = requestRevision({ permitId, type, originalValue, newValue, reason });
    if (ok) {
      navigate({
        to: "/operator/permits/$permitNumber",
        params: { permitNumber: resolvedPermitNumber },
      });
    }
  };

  return (
    <PortalPage
      title="Request Permit Revision"
      description={`Amend permit ${resolvedPermitNumber}. The authority reviews and reissues a new version when approved.`}
      breadcrumb={[
        { label: "Permits", to: "/operator/permits" },
        { label: resolvedPermitNumber, to: `/operator/permits/${resolvedPermitNumber}` },
        { label: "Revision" },
      ]}
    >
      <div className="mx-auto max-w-3xl space-y-5">
        <SectionCard
          title="Current Permit"
          description="Values on the issued permit that may be amended."
        >
          <DescriptionList
            columns={3}
            items={[
              { label: "Permit number", value: resolvedPermitNumber },
              { label: "Authorization", value: permit?.authorization ?? "OVERFLIGHT" },
              { label: "Version", value: permit ? `V${permit.version}` : "V1" },
              { label: "Flight", value: permit?.flightNumber ?? "—" },
              { label: "Valid from", value: permit?.validFrom ?? "—" },
              { label: "Valid until", value: permit?.validUntil ?? "—" },
            ]}
          />
        </SectionCard>

        <SectionCard
          title="Revision Details"
          description="Provide the change and the reason for the request."
        >
          <div className="space-y-4">
            <Field label="Revision type" required>
              <Select value={type} onValueChange={(value) => setType(value as RevisionType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select revision type" />
                </SelectTrigger>
                <SelectContent>
                  {REVISION_TYPES.map((revisionType) => (
                    <SelectItem key={revisionType} value={revisionType}>
                      {revisionType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Original value" required>
              <Input
                value={originalValue}
                onChange={(event) => setOriginalValue(event.target.value)}
              />
            </Field>

            <Field label="New value" required>
              <Input value={newValue} onChange={(event) => setNewValue(event.target.value)} />
            </Field>

            <Field label="Reason for revision" required>
              <Textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={4}
                placeholder="Explain why this revision is required."
              />
            </Field>
          </div>
        </SectionCard>

        <ActionBar className="rounded-xl border border-border-soft">
          <Button
            variant="outline"
            onClick={() =>
              navigate({
                to: "/operator/permits/$permitNumber",
                params: { permitNumber: resolvedPermitNumber },
              })
            }
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            <Send size={15} /> Submit revision request
          </Button>
        </ActionBar>
      </div>
    </PortalPage>
  );
}
