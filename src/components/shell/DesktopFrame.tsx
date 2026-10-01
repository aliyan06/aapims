import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { useFitScale } from "@/hooks/use-fit-scale";
import { DesktopOverlayContext } from "@/components/shell/desktop-overlay";

const DESIGN_WIDTH = 1440;
const DESIGN_HEIGHT = 900;

type DesktopFrameProps = {
  children: ReactNode;
  /** Browser address-bar text. */
  url?: string;
  /** Optional left sidebar (portal navigation). */
  sidebar?: ReactNode;
};

/**
 * Browser-window frame for the AAPIMS portals.
 * Fixed 1440x900 design, scaled to fit the presenter's viewport.
 */
export function DesktopFrame({ children, url = "aapims.gov.demo", sidebar }: DesktopFrameProps) {
  const { ref, scale } = useFitScale(DESIGN_WIDTH, DESIGN_HEIGHT, 40);
  const overlayHostRef = useRef<HTMLDivElement>(null);
  const [overlayEl, setOverlayEl] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    setOverlayEl(overlayHostRef.current);
  }, []);

  return (
    <div
      ref={ref}
      className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden"
    >
      <div
        style={{ width: DESIGN_WIDTH * scale, height: DESIGN_HEIGHT * scale }}
        className="relative"
      >
        <div
          style={{
            width: DESIGN_WIDTH,
            height: DESIGN_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
          className="absolute left-0 top-0 flex flex-col overflow-hidden rounded-2xl border border-border-strong bg-surface shadow-frame"
        >
          {/* Window chrome */}
          <div className="flex h-11 shrink-0 items-center gap-4 border-b border-border-soft bg-surface-muted px-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-declined" />
              <span className="h-3 w-3 rounded-full bg-pending" />
              <span className="h-3 w-3 rounded-full bg-confirmed" />
            </div>
            <div className="flex h-7 flex-1 items-center gap-2 rounded-full border border-border-soft bg-surface px-3 text-[12px] text-text-muted">
              <Lock size={12} className="text-text-subtle" />
              <span className="truncate">{url}</span>
            </div>
          </div>

          {/* Body */}
          <div className="flex min-h-0 flex-1">
            {sidebar}
            {/* Non-scrolling pane; the drawer overlay anchors here, not to the scroll. */}
            <div className="relative min-h-0 flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto no-scrollbar">
                <DesktopOverlayContext.Provider value={overlayEl}>
                  {children}
                </DesktopOverlayContext.Provider>
              </div>
              <div ref={overlayHostRef} className="pointer-events-none absolute inset-0 z-40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
