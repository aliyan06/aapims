import { useState, type ReactNode } from "react";
import { PresenterPanel } from "@/components/shell/PresenterPanel";
import { StoreInspector } from "@/components/shell/StoreInspector";
import { StoreToasts } from "@/components/shell/StoreToasts";
import { DesktopFrame } from "@/components/shell/DesktopFrame";
import type { Role } from "@/components/shell/roles";

type DeviceStageProps = {
  role: Role;
  children: ReactNode;
  /** Left sidebar navigation for the portal. */
  sidebar?: ReactNode;
  /** Address-bar text. */
  url?: string;
};

/** Subtle aviation motif: navy gradient with dashed routes and waypoints. */
function RouteBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-deep via-primary to-primary-soft" />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <path
          d="M -60 720 Q 320 540 620 580 T 1180 320 T 1540 170"
          className="aa-route-dash stroke-accent/50"
          strokeWidth="2"
          strokeDasharray="8 10"
          strokeLinecap="round"
        />
        <path
          d="M -60 240 Q 280 300 520 180 T 1100 120 T 1540 80"
          className="stroke-white/20"
          strokeWidth="1.5"
          strokeDasharray="6 12"
          strokeLinecap="round"
        />
        <circle cx="620" cy="580" r="5" className="fill-accent/70" />
        <circle cx="1180" cy="320" r="5" className="fill-accent/70" />
        <circle cx="520" cy="180" r="4" className="fill-white/40" />
        <circle cx="1100" cy="120" r="4" className="fill-white/40" />
      </svg>
    </div>
  );
}

/**
 * Centres the desktop frame for the current role and hosts the presenter
 * panel beside it. Never renders the panel inside the frame.
 */
export function DeviceStage({ role, children, sidebar, url }: DeviceStageProps) {
  const [panelOpen, setPanelOpen] = useState(true);

  return (
    <div className="relative flex h-dvh w-full overflow-hidden">
      <RouteBackdrop />
      <PresenterPanel open={panelOpen} onToggle={() => setPanelOpen((o) => !o)} />
      <main className="relative z-10 flex min-h-0 min-w-0 flex-1 items-stretch justify-center p-4 sm:p-6">
        <DesktopFrame url={url} sidebar={sidebar}>
          {children}
        </DesktopFrame>
      </main>
      <StoreInspector />
      <StoreToasts />
    </div>
  );
}
