import { BadgeCheck, Download, Printer, ScanLine, ShieldCheck } from "lucide-react";
import type { PermitRecord } from "@/data/types";
import { getAircraft, operatorName } from "@/data/lookups";
import { formatDate, useAuthority, useWorld } from "@/store";
import { QRVisual } from "./QRVisual";

type DigitalPermitProps = {
  permit: PermitRecord;
  onVerify?: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border-soft py-2">
      <span className="text-[10px] font-bold uppercase tracking-wide text-text-subtle">
        {label}
      </span>
      <span className="text-[13px] font-semibold text-text-dark">{value}</span>
    </div>
  );
}

/** Official-style mock digital permit document. */
export function DigitalPermit({ permit, onVerify, onDownload, onPrint }: DigitalPermitProps) {
  const world = useWorld();
  const authority = useAuthority();
  const aircraft = getAircraft(world, permit.aircraftId);
  const operator = operatorName(world, permit.operatorId);
  const title =
    permit.authorization === "OVERFLIGHT" ? "DIGITAL OVERFLIGHT PERMIT" : "DIGITAL LANDING PERMIT";

  return (
    <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-xl border-2 border-primary/20 bg-surface shadow-card">
      <header className="flex items-center justify-between gap-4 bg-primary px-6 py-4 text-white">
        <div className="flex items-center gap-3">
          <ShieldCheck size={28} className="text-accent" />
          <div>
            <div className="text-[12px] font-bold uppercase tracking-[0.22em] text-white/70">
              {authority.name}
            </div>
            <div className="text-[18px] font-black tracking-wide">AAPIMS</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
            Permit Type
          </div>
          <div className="text-[14px] font-extrabold">{title}</div>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-6 px-6 py-5">
        <div className="col-span-2">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-md bg-status-issued-soft px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide text-status-issued">
              {permit.status}
            </span>
            <span className="text-[12px] font-semibold text-text-muted">
              Version {permit.version}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-6">
            <Row label="Permit Number" value={permit.permitNumber} />
            <Row label="Application Reference" value={permit.applicationReference} />
            <Row label="Operator" value={operator} />
            <Row label="Aircraft" value={`${aircraft.registration} · ${aircraft.type}`} />
            <Row label="Flight" value={permit.flightNumber} />
            <Row label="Route" value={permit.routeLabel} />
            <Row label="Entry Point" value={permit.entryPoint} />
            <Row label="Exit Point" value={permit.exitPoint} />
            <Row label="Valid From" value={formatDate(permit.validFrom)} />
            <Row label="Valid Until" value={formatDate(permit.validUntil)} />
          </div>

          <div className="mt-5 flex items-end justify-between gap-6">
            <div>
              <div className="border-b border-text-dark/60 pb-1">
                <span className="font-[cursive] text-[18px] italic text-primary">
                  {permit.signedBy}
                </span>
              </div>
              <div className="mt-1 text-[11px] font-semibold text-text-muted">
                Digitally signed · {permit.signedBy}
              </div>
              <div className="text-[11px] text-text-subtle">
                Issued {formatDate(permit.issuedAt)}
              </div>
            </div>

            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-seal/70 text-seal aa-stamp">
              <div className="flex flex-col items-center leading-none">
                <BadgeCheck size={22} />
                <span className="mt-0.5 text-[8px] font-black uppercase tracking-wide">
                  Official
                </span>
                <span className="text-[8px] font-black uppercase tracking-wide">Seal</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-l border-border-soft pl-6">
          <QRVisual value={permit.permitNumber} />
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-text-subtle">
              Verification Reference
            </div>
            <div className="text-[12px] font-semibold text-text-dark">
              {permit.verificationReference}
            </div>
            <div className="mt-1 text-[10px] text-text-subtle">Checksum {permit.checksum}</div>
          </div>
          <div className="text-center text-[10px] font-semibold text-text-muted">
            Digitally issued through AAPIMS
          </div>
        </div>
      </div>

      <footer className="flex items-center justify-end gap-2 border-t border-border-soft bg-surface-muted px-6 py-3">
        {onDownload ? (
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-2 rounded-lg border border-border-strong bg-surface px-3.5 py-2 text-[12px] font-semibold text-text-dark transition-colors hover:bg-surface-muted"
          >
            <Download size={15} /> Download PDF
          </button>
        ) : null}
        {onPrint ? (
          <button
            type="button"
            onClick={onPrint}
            className="inline-flex items-center gap-2 rounded-lg border border-border-strong bg-surface px-3.5 py-2 text-[12px] font-semibold text-text-dark transition-colors hover:bg-surface-muted"
          >
            <Printer size={15} /> Print
          </button>
        ) : null}
        {onVerify ? (
          <button
            type="button"
            onClick={onVerify}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-[12px] font-bold text-accent-foreground transition-colors hover:bg-accent-pressed"
          >
            <ScanLine size={15} /> Verify Permit
          </button>
        ) : null}
      </footer>
    </div>
  );
}
