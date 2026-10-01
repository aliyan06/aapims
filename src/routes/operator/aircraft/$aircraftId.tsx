import { createFileRoute } from "@tanstack/react-router";
import { Plane } from "lucide-react";
import {
  DescriptionList,
  DocumentStatusBadge,
  EmptyState,
  PortalPage,
  SectionCard,
} from "@/components/desktop";
import type { AircraftRecord } from "@/data/types";
import { operatorName } from "@/data/lookups";
import { formatDate, useAircraftItem, useWorld } from "@/store";

export const Route = createFileRoute("/operator/aircraft/$aircraftId")({
  component: AircraftDetail,
});

function formatWeight(value: number): string {
  return `${new Intl.NumberFormat("en-US").format(value)} kg`;
}

type CertificateKey = keyof AircraftRecord["certificates"];

const CERTIFICATE_LABEL: Record<CertificateKey, string> = {
  registration: "Certificate of Registration",
  airworthiness: "Certificate of Airworthiness",
  insurance: "Insurance Certificate",
  noise: "Noise Certificate",
};

function AircraftDetail() {
  const { aircraftId } = Route.useParams();
  const world = useWorld();
  const aircraft = useAircraftItem(aircraftId);

  if (!aircraft) {
    return (
      <PortalPage
        title="Aircraft not found"
        breadcrumb={[{ label: "Aircraft", to: "/operator/aircraft" }, { label: "Unknown" }]}
      >
        <SectionCard>
          <EmptyState
            icon={Plane}
            title="We could not find that aircraft"
            description="It may have been removed from your operator account. Return to the aircraft list."
          />
        </SectionCard>
      </PortalPage>
    );
  }

  const certificateKeys: CertificateKey[] = ["registration", "airworthiness", "insurance", "noise"];

  return (
    <PortalPage
      title={`${aircraft.registration} · ${aircraft.type}`}
      description="Aircraft record, certificate references and validity."
      breadcrumb={[
        { label: "Aircraft", to: "/operator/aircraft" },
        { label: aircraft.registration },
      ]}
    >
      <div className="space-y-5">
        <SectionCard title="Aircraft details">
          <DescriptionList
            columns={3}
            items={[
              { label: "Registration mark", value: aircraft.registration },
              { label: "Aircraft type", value: aircraft.type },
              { label: "Maximum take-off weight", value: formatWeight(aircraft.mtowKg) },
              { label: "Operator", value: operatorName(world, aircraft.operatorId) },
              { label: "Aircraft record ID", value: aircraft.id },
            ]}
          />
        </SectionCard>

        <SectionCard
          title="Certificates"
          description="Each certificate is verified against the authority's records."
          padded={false}
        >
          <div className="divide-y divide-border-soft">
            {certificateKeys.map((key) => {
              const certificate = aircraft.certificates[key];
              return (
                <div
                  key={key}
                  className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-text-dark">
                      {CERTIFICATE_LABEL[key]}
                    </div>
                    <div className="mt-0.5 text-[11px] text-text-subtle">
                      Reference {certificate.reference}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-text-subtle">
                        Expiry
                      </div>
                      <div className="text-[13px] font-medium text-text-dark">
                        {formatDate(certificate.expiry)}
                      </div>
                    </div>
                    <DocumentStatusBadge status={certificate.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Operational note">
          <p className="text-[12.5px] text-text-muted">
            This aircraft may be selected when applying for a permit. Applications referencing an
            expired or expiring certificate are flagged during validation. Current certificate
            statuses are shown above.
          </p>
        </SectionCard>
      </div>
    </PortalPage>
  );
}
