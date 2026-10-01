import { createContext, useContext } from "react";

/**
 * Host element for desktop in-frame overlays (e.g. the organizer DetailDrawer).
 * The DesktopFrame provides a non-scrolling, absolutely-positioned host so
 * overlays stay put while the content pane scrolls underneath.
 */
export const DesktopOverlayContext = createContext<HTMLElement | null>(null);

export function useDesktopOverlay(): HTMLElement | null {
  return useContext(DesktopOverlayContext);
}
