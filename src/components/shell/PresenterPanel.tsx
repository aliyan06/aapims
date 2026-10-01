import { type ComponentType } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  CreditCard,
  Eye,
  FileText,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import {
  AUTHORITY_ROLES,
  CUSTOMER_ROLES,
  DEMO_START_ROUTE,
  PUBLIC_ROLES,
  ROLE_HOME,
  ROLE_LABEL,
  type Role,
} from "@/components/shell/roles";
import { formatClock, useAppStore } from "@/store";
import { cn } from "@/lib/utils";

const ROLE_ICON: Record<Role, ComponentType<{ size?: number; className?: string }>> = {
  operatorAdmin: Building2,
  permitOfficer: FileText,
  operatorFinance: CreditCard,
  viewer: Eye,
  reviewer: ClipboardCheck,
  finance: Wallet,
  approver: BadgeCheck,
  superadmin: ShieldCheck,
  public: ScanLine,
};

type PresenterPanelProps = {
  open: boolean;
  onToggle: () => void;
};

/** Demo-only control panel. Always rendered outside the device frames. */
export function PresenterPanel({ open, onToggle }: PresenterPanelProps) {
  const navigate = useNavigate();
  const role = useAppStore((s) => s.meta.activeRole);
  const clockIso = useAppStore((s) => s.clock.iso);
  const signIn = useAppStore((s) => s.signIn);
  const resetDemo = useAppStore((s) => s.resetDemo);

  // Built at render time (not module scope) to avoid depending on another
  // module's initialisation order in the chunked SSR bundle.
  const roleSections: { label: string; roles: readonly Role[] }[] = [
    { label: "Authority Side", roles: AUTHORITY_ROLES },
    { label: "Customer Side", roles: CUSTOMER_ROLES },
    { label: "Public", roles: PUBLIC_ROLES },
  ];

  if (!open) {
    return (
      <div className="relative z-20 flex h-dvh shrink-0 flex-col items-center border-r border-white/10 bg-primary-deep/95 py-4 backdrop-blur">
        <button
          type="button"
          onClick={onToggle}
          aria-label="Open presenter panel"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <ChevronRight size={18} />
        </button>
        <span className="mt-4 rotate-180 text-[10px] font-bold uppercase tracking-[0.3em] text-white/60 [writing-mode:vertical-rl]">
          Presenter
        </span>
      </div>
    );
  }

  return (
    <aside className="relative z-20 flex h-dvh w-[280px] shrink-0 flex-col border-r border-white/10 bg-primary-deep/95 backdrop-blur">
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">
            Presenter
          </div>
          <div className="text-[13px] font-bold text-white">AAPIMS demo</div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Collapse presenter panel"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 pb-4 no-scrollbar">
        <section className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-white">
            <Clock3 size={14} className="text-accent" />
            {formatClock(clockIso)}
          </div>
          <div className="mt-1 truncate text-[11px] text-white/60">Representative demo state</div>
        </section>

        {roleSections.map((section) => (
          <section key={section.label}>
            <h2 className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/50">
              {section.label}
            </h2>
            <div className="space-y-1">
              {section.roles.map((r) => {
                const Icon = ROLE_ICON[r];
                const active = r === role;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      signIn(r);
                      void navigate({ to: ROLE_HOME[r] });
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] font-semibold transition-colors",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-white/80 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <Icon size={16} />
                    {ROLE_LABEL[r]}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => {
            resetDemo();
            void navigate({ to: DEMO_START_ROUTE });
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-[12px] font-semibold text-white/80 transition-colors hover:bg-white/20"
        >
          <RotateCcw size={14} />
          Reset demo
        </button>
      </div>
    </aside>
  );
}
