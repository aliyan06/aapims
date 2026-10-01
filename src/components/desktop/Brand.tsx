import { cn } from "@/lib/utils";

/** Moavin Technologies logo, used exactly as supplied. */
export function MoavinLogo({ className }: { className?: string }) {
  return (
    <img
      src="/moavin-logo.jpeg"
      alt="Moavin Technologies"
      className={cn("h-7 w-auto object-contain", className)}
    />
  );
}

type AapimsBrandProps = {
  tone?: "dark" | "light";
  compact?: boolean;
  className?: string;
};

/** AAPIMS wordmark. AAPIMS stays the primary system identity. */
export function AapimsBrand({ tone = "dark", compact = false, className }: AapimsBrandProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg text-[15px] font-black text-white",
          tone === "dark" ? "bg-primary" : "bg-white/15",
        )}
      >
        AA
      </span>
      <div className="leading-tight">
        <div
          className={cn(
            "text-[15px] font-black tracking-wide",
            tone === "dark" ? "text-text-dark" : "text-white",
          )}
        >
          AAPIMS
        </div>
        {!compact ? (
          <div
            className={cn(
              "text-[10px] font-semibold",
              tone === "dark" ? "text-text-muted" : "text-white/70",
            )}
          >
            Aviation Authority Permit Integrated Management System
          </div>
        ) : null}
      </div>
    </div>
  );
}
