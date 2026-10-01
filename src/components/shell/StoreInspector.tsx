import { useState } from "react";
import { ChevronLeft, ChevronRight, FlaskConical } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { STORY_IDS } from "@/data/types";
import { formatClock, useAppStore, useInspectorSnapshot } from "@/store";

/**
 * Development-only inspector. The wrapper resolves DEV before rendering the
 * panel, so none of the inspector's store hooks run in production builds.
 */
export function StoreInspector() {
  if (!import.meta.env.DEV) return null;
  return <StoreInspectorPanel />;
}

function StoreInspectorPanel() {
  const [open, setOpen] = useState(false);
  const snapshot = useInspectorSnapshot();

  const actions = useAppStore(
    useShallow((s) => ({
      submitApplication: s.submitApplication,
      recommendApproval: s.recommendApproval,
      clearFinancialHold: s.clearFinancialHold,
      passTechnicalReview: s.passTechnicalReview,
      approvePermit: s.approvePermit,
      issuePermit: s.issuePermit,
      requestRevision: s.requestRevision,
      approveRevision: s.approveRevision,
      returnApplication: s.returnApplication,
    })),
  );

  if (!open) {
    return (
      <div className="relative z-20 flex h-dvh shrink-0 flex-col items-center border-l border-white/10 bg-black/70 py-4 backdrop-blur">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open store inspector"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="mt-4 rotate-180 text-[10px] font-bold uppercase tracking-[0.3em] text-accent/80 [writing-mode:vertical-rl]">
          Store inspector
        </span>
      </div>
    );
  }

  const counter = (label: string, value: number | string) => (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-white/55">{label}</span>
      <span className="font-semibold text-white/90">{value}</span>
    </div>
  );

  const action = (label: string, onClick: () => void) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      className="rounded-md bg-white/10 px-2 py-1.5 text-left text-[11px] font-semibold text-white/85 transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      {label}
    </button>
  );

  return (
    <aside className="relative z-20 flex h-dvh w-[248px] shrink-0 flex-col border-l border-white/10 bg-black/75 backdrop-blur">
      <div className="flex items-center justify-between px-3 pb-2 pt-4">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
          <FlaskConical size={14} />
          Inspector
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Collapse store inspector"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 pb-4 no-scrollbar">
        <section className="space-y-1 rounded-lg border border-white/10 bg-white/5 p-3">
          {counter("Scene", snapshot.scene)}
          {counter("Role", snapshot.role)}
          {counter("Clock", formatClock(snapshot.clock))}
          {counter("Hero status", snapshot.heroStatus)}
        </section>

        <section className="space-y-1 rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/45">
            Permit pipeline
          </div>
          {counter("New", snapshot.newApplications)}
          {counter("Under review", snapshot.underReview)}
          {counter("Awaiting finance", snapshot.awaitingFinance)}
          {counter("Technical", snapshot.technicalReview)}
          {counter("Awaiting approval", snapshot.awaitingApproval)}
          {counter("Approved", snapshot.approved)}
          {counter("Issued", snapshot.issued)}
        </section>

        <section className="space-y-1 rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/45">
            Records
          </div>
          {counter("Applications", snapshot.applications)}
          {counter("Permits", snapshot.permits)}
          {counter("Revisions", snapshot.revisions)}
          {counter("Audit entries", snapshot.audit)}
        </section>

        <section className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/45">
            Last action
          </div>
          <div className="mt-1 text-[11px] text-white/85">{snapshot.lastAction}</div>
        </section>

        <section className="space-y-1.5 rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/45">
            Story actions
          </div>
          <div className="grid gap-1.5">
            {action("Submit hero application", () =>
              actions.submitApplication(STORY_IDS.application),
            )}
            {action("Recommend approval", () => actions.recommendApproval(STORY_IDS.application))}
            {action("Return application", () => actions.returnApplication(STORY_IDS.application))}
            {action("Clear financial hold", () =>
              actions.clearFinancialHold(STORY_IDS.application),
            )}
            {action("Pass technical review", () =>
              actions.passTechnicalReview(STORY_IDS.application),
            )}
            {action("Approve permit", () => actions.approvePermit(STORY_IDS.application))}
            {action("Issue digital permit", () => actions.issuePermit(STORY_IDS.application))}
            {action("Request revision (V2)", () =>
              actions.requestRevision({
                permitId: STORY_IDS.permit,
                type: "Date / Time Change",
                originalValue: "15 Oct 2026 — 08:30 UTC",
                newValue: "15 Oct 2026 — 10:00 UTC",
                reason: "Operational schedule change",
              }),
            )}
            {action("Approve revision", () => actions.approveRevision("rev-001"))}
          </div>
        </section>
      </div>
    </aside>
  );
}
