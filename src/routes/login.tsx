import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Lock, Mail, ShieldCheck } from "lucide-react";
import { AapimsBrand, MoavinLogo } from "@/components/desktop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_ACCOUNTS, ROLE_HOME, ROLE_LABEL } from "@/components/shell/roles";
import { useAppStore } from "@/store";

export const Route = createFileRoute("/login")({
  component: LoginScreen,
});

function LoginScreen() {
  const navigate = useNavigate();
  const setActiveRole = useAppStore((s) => s.setActiveRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function signIn(nextEmail: string, nextPassword: string) {
    const account = DEMO_ACCOUNTS.find(
      (item) =>
        item.email.toLowerCase() === nextEmail.trim().toLowerCase() &&
        item.password === nextPassword,
    );

    if (!account) {
      setError("Those credentials do not match a demo account. Use one of the accounts below.");
      return;
    }

    setError(null);
    setActiveRole(account.role);
    void navigate({ to: ROLE_HOME[account.role] });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    signIn(email, password);
  }

  return (
    <div className="flex min-h-dvh w-full bg-background">
      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-deep via-primary to-primary-soft px-12 py-12 text-white lg:flex">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 720 900"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            <path
              d="M -40 700 Q 180 520 360 560 T 720 320 T 800 200"
              className="aa-route-dash stroke-accent/45"
              strokeWidth="2"
              strokeDasharray="8 10"
              strokeLinecap="round"
            />
            <path
              d="M -40 220 Q 180 300 360 180 T 760 100"
              className="stroke-white/15"
              strokeWidth="1.5"
              strokeDasharray="6 12"
              strokeLinecap="round"
            />
            <circle cx="360" cy="560" r="5" className="fill-accent/70" />
            <circle cx="720" cy="320" r="5" className="fill-accent/70" />
          </svg>
        </div>

        <div className="relative z-10">
          <AapimsBrand tone="light" />
        </div>

        <div className="relative z-10">
          <h1 className="text-[38px] font-black leading-[1.05] tracking-tight text-white">
            Aviation Authority Permit Integrated Management System
          </h1>
          <p className="mt-4 max-w-md text-[14px] font-medium text-white/70">
            A single digital workspace for registration, permit application, financial clearance,
            technical review, approval and e-permit issuance.
          </p>
          <div className="mt-8 flex items-center gap-3 rounded-xl border border-white/12 bg-white/[0.06] px-4 py-3">
            <ShieldCheck size={18} className="text-accent" />
            <span className="text-[12px] font-semibold text-white/80">
              Proof of concept · all demo data is fictional
            </span>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 border-t border-white/10 pt-5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
            Powered by
          </span>
          <MoavinLogo className="h-6 w-auto brightness-0 invert opacity-90" />
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-[12px] font-semibold text-text-muted transition-colors hover:text-accent"
          >
            <ArrowLeft size={14} />
            Back to launcher
          </Link>

          <div className="rounded-2xl border border-border-soft bg-surface p-7 shadow-card">
            <div className="lg:hidden">
              <AapimsBrand />
            </div>
            <h2 className="mt-4 text-[22px] font-extrabold text-text-dark lg:mt-0">Sign in</h2>
            <p className="mt-1 text-[13px] text-text-muted">
              Access the Aviation Authority Permit Integrated Management System.
            </p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-text-dark">
                  Email address
                </Label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle"
                  />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    placeholder="you@authority.gov"
                    className="pl-9"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-text-dark">
                  Password
                </Label>
                <div className="relative">
                  <Lock
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle"
                  />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pl-9"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
              </div>

              {error ? (
                <p
                  role="alert"
                  className="rounded-lg border border-status-rejected/30 bg-status-rejected-soft px-3.5 py-2.5 text-[12px] font-semibold text-status-rejected"
                >
                  {error}
                </p>
              ) : null}

              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>

            <div className="mt-7 border-t border-border-soft pt-5">
              <div className="flex items-center justify-between">
                <h3 className="text-[12px] font-bold uppercase tracking-wide text-text-muted">
                  Demo access
                </h3>
                <span className="text-[11px] text-text-subtle">Select an account to sign in</span>
              </div>

              <div className="mt-3 space-y-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.role}
                    type="button"
                    onClick={() => signIn(account.email, account.password)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-border-soft bg-surface-muted/40 px-3.5 py-2.5 text-left transition-colors hover:border-accent/50 hover:bg-info-soft/50"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-bold text-text-dark">
                        {ROLE_LABEL[account.role]}
                      </div>
                      <div className="truncate text-[11px] text-text-muted">
                        {account.displayName} · {account.email}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-md bg-surface px-2 py-0.5 text-[11px] font-semibold text-text-subtle">
                      {account.password}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-5 text-center text-[11px] text-text-subtle">
            Prepared by Moavin Technologies. Demonstration prototype, not connected to live systems.
          </p>
        </div>
      </main>
    </div>
  );
}
