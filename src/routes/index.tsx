import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Building2,
  ClipboardCheck,
  Play,
  ScanLine,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { DEMO_START_ROUTE, ROLE_HOME, type Role } from "@/components/shell/roles";
import { MoavinLogo } from "@/components/desktop";

// L1 - Launcher (HERO)
export const Route = createFileRoute("/")({
  component: Launcher,
});

type RoleCard = {
  role: Role;
  label: string;
  description: string;
  surface: string;
  icon: LucideIcon;
};

const ROLE_CARDS: RoleCard[] = [
  {
    role: "operatorAdmin",
    label: "Operator Portal",
    description: "Register, manage aircraft and documents, apply for permits and track them.",
    surface: "Web portal",
    icon: Building2,
  },
  {
    role: "reviewer",
    label: "Permit Reviewer",
    description: "Review applications, run technical checks and recommend approval.",
    surface: "Authority",
    icon: ClipboardCheck,
  },
  {
    role: "finance",
    label: "Finance Officer",
    description: "Verify payment and clear the financial requirement for a permit.",
    surface: "Authority",
    icon: Wallet,
  },
  {
    role: "approver",
    label: "Permit Approver",
    description: "Approve applications and issue the digital e-permit.",
    surface: "Authority",
    icon: BadgeCheck,
  },
  {
    role: "public",
    label: "Public Verification",
    description: "Verify an issued permit by number or application reference.",
    surface: "Public",
    icon: ScanLine,
  },
];

function Backdrop() {
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
          d="M -60 760 Q 320 560 620 600 T 1180 320 T 1540 150"
          className="aa-route-dash stroke-accent/40"
          strokeWidth="2"
          strokeDasharray="8 10"
          strokeLinecap="round"
        />
        <path
          d="M -60 220 Q 280 300 540 160 T 1120 110 T 1540 60"
          className="stroke-white/15"
          strokeWidth="1.5"
          strokeDasharray="6 12"
          strokeLinecap="round"
        />
        <circle cx="620" cy="600" r="5" className="fill-accent/60" />
        <circle cx="1180" cy="320" r="5" className="fill-accent/60" />
        <circle cx="540" cy="160" r="4" className="fill-white/35" />
        <circle cx="1120" cy="110" r="4" className="fill-white/35" />
      </svg>
    </div>
  );
}

function Launcher() {
  return (
    <main className="relative flex min-h-dvh w-full flex-col overflow-hidden bg-primary-deep text-white">
      <Backdrop />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8 sm:px-10">
        <div className="aa-fade-up flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-float">
              <ShieldCheck size={20} />
            </span>
            <span className="text-[12px] font-bold uppercase tracking-[0.28em] text-white/70">
              Moavin Technologies
            </span>
          </div>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[12px] font-semibold text-white/80">
            Demonstration · all data fictional
          </span>
        </div>

        <div className="aa-fade-up mt-10 max-w-3xl" style={{ animationDelay: "0.08s" }}>
          <h1 className="text-[46px] font-black leading-[1.02] tracking-tight text-white sm:text-[58px]">
            A<span className="text-accent">A</span>PIMS
          </h1>
          <p className="mt-2 text-[18px] font-semibold text-white sm:text-[22px]">
            Aviation Authority Permit Integrated Management System
          </p>
          <p className="mt-3 text-[14px] font-bold uppercase tracking-[0.22em] text-white/70">
            Apply · Review · Clear · Approve · Issue · Verify
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[13px] font-semibold text-white/85">
            Proof of concept for the complete aviation permit lifecycle
          </p>
        </div>

        <div className="aa-fade-up mt-8" style={{ animationDelay: "0.16s" }}>
          <Link
            to={DEMO_START_ROUTE}
            className="inline-flex items-center gap-3 rounded-full bg-accent px-7 py-3.5 text-[15px] font-bold text-accent-foreground shadow-float transition-colors hover:bg-accent-pressed"
          >
            <Play size={18} />
            Start the story
          </Link>
        </div>

        <div
          className="aa-fade-up mt-8 grid flex-1 content-start gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          style={{ animationDelay: "0.24s" }}
        >
          {ROLE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.role}
                to={ROLE_HOME[card.role]}
                className="group flex flex-col rounded-2xl border border-white/12 bg-white/[0.06] p-4 backdrop-blur-sm transition-colors hover:border-accent/60 hover:bg-white/[0.1]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <Icon size={20} />
                </span>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <h2 className="text-[15px] font-bold text-white">{card.label}</h2>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/70">
                    {card.surface}
                  </span>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-white/65">{card.description}</p>
              </Link>
            );
          })}
        </div>

        <div
          className="aa-fade-up mt-8 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-white/45"
          style={{ animationDelay: "0.32s" }}
        >
          <span>Prepared by Moavin Technologies. Demo prototype, all data is fictional.</span>
          <MoavinLogo className="h-6 w-auto brightness-0 invert opacity-80" />
        </div>
      </div>
    </main>
  );
}
