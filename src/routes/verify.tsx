import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ScanLine, Search } from "lucide-react";
import { AapimsBrand, Field, MoavinLogo, SectionCard } from "@/components/desktop";
import { DeviceStage } from "@/components/shell/DeviceStage";
import { ROLE_DESKTOP_URL } from "@/components/shell/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PermitStatusResult,
  type PermitVerificationStatus,
} from "@/components/permit/PermitStatusResult";
import { STORY_IDS, type PermitRecord } from "@/data/types";
import { useAuthority, useClockIso, usePermits, useWorld } from "@/store";

export const Route = createFileRoute("/verify")({
  validateSearch: (search: Record<string, unknown>) => ({
    permit: typeof search.permit === "string" ? search.permit : undefined,
    reference: typeof search.reference === "string" ? search.reference : undefined,
  }),
  component: VerifyScreen,
});

type VerificationResult = {
  status: PermitVerificationStatus;
  permit: PermitRecord | undefined;
};

function VerifyScreen() {
  const search = Route.useSearch();
  const world = useWorld();
  const authority = useAuthority();
  const permits = usePermits();
  const clock = useClockIso();

  // Pre-fill the hero permit when it exists (presenter scene 8 shows a VALID result);
  // otherwise start empty so the public page is a clean look-up form.
  const heroPermit = permits.find((item) => item.permitNumber === STORY_IDS.permitNumber);
  const initialTerm = search.permit ?? search.reference ?? heroPermit?.permitNumber ?? "";

  const [term, setTerm] = useState(initialTerm);
  const [submittedTerm, setSubmittedTerm] = useState(initialTerm);

  useEffect(() => {
    const next = search.permit ?? search.reference ?? heroPermit?.permitNumber ?? "";
    if (next) {
      setTerm(next);
      setSubmittedTerm(next);
    }
  }, [search.permit, search.reference, heroPermit?.permitNumber]);

  const result = useMemo<VerificationResult | null>(() => {
    const query = submittedTerm.trim().toLowerCase();
    if (!query) return null;

    let permit = permits.find((item) => item.permitNumber.toLowerCase() === query);
    if (!permit) {
      const application = world.applications.find((item) => item.reference.toLowerCase() === query);
      if (application?.permitId) {
        permit = permits.find((item) => item.id === application.permitId);
      }
    }

    if (!permit) return { status: "INVALID", permit: undefined };
    if (permit.status === "REVOKED") return { status: "REVOKED", permit };

    const today = clock.slice(0, 10);
    const expired = permit.status === "EXPIRED" || today > permit.validUntil.slice(0, 10);
    if (expired) return { status: "EXPIRED", permit };

    if (permit.status === "ISSUED" || permit.status === "ACTIVE" || permit.status === "REISSUED") {
      return { status: "VALID", permit };
    }

    return { status: "INVALID", permit: undefined };
  }, [submittedTerm, permits, world.applications, clock]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedTerm(term.trim());
  }

  return (
    <DeviceStage role="public" url={ROLE_DESKTOP_URL.public}>
      <div className="flex min-h-full flex-col bg-background">
        <header className="flex items-center justify-between gap-4 border-b border-border-soft bg-surface px-6 py-4">
          <div className="flex min-w-0 items-center gap-4">
            <AapimsBrand />
            <span className="hidden h-8 w-px bg-border-soft sm:block" />
            <span className="hidden truncate text-[12px] font-semibold text-text-muted sm:block">
              {authority.name} · Public Verification Service
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <MoavinLogo className="h-6 w-auto" />
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-text-muted transition-colors hover:text-accent"
            >
              <ArrowLeft size={14} />
              Back to launcher
            </Link>
          </div>
        </header>

        <main className="flex-1 px-6 py-8">
          <div className="mx-auto w-full max-w-4xl space-y-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface-muted px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-text-muted">
                <ScanLine size={14} />
                No login required
              </div>
              <h1 className="mt-3 text-[24px] font-extrabold text-text-dark">
                Verify an aviation permit
              </h1>
              <p className="mt-1 max-w-2xl text-[13px] text-text-muted">
                Enter a permit number or application reference to confirm that a permit was
                digitally issued by the {authority.name} through AAPIMS.
              </p>
            </div>

            <SectionCard>
              <form onSubmit={onSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <Field
                  label="Permit number or application reference"
                  className="flex-1"
                  hint="For example CAA-OF-2026-00452 or AAP-2026-00125."
                >
                  <Input
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                    placeholder="CAA-OF-2026-00452"
                    className="h-10"
                  />
                </Field>
                <Button type="submit" size="lg" className="gap-2 sm:mb-[22px]">
                  <Search size={16} />
                  Verify Permit
                </Button>
              </form>
            </SectionCard>

            {result ? (
              <PermitStatusResult
                status={result.status}
                permit={result.permit}
                searchedTerm={submittedTerm}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-border-strong bg-surface-muted/40 px-6 py-10 text-center">
                <p className="text-[13px] font-semibold text-text-muted">
                  Enter a permit number or application reference to begin verification.
                </p>
                <p className="mt-1 text-[12px] text-text-subtle">
                  Verification is read-only and exposes no financial or internal records.
                </p>
              </div>
            )}

            <p className="text-center text-[11px] text-text-subtle">
              Demonstration prototype prepared by Moavin Technologies. All data is fictional.
            </p>
          </div>
        </main>
      </div>
    </DeviceStage>
  );
}
