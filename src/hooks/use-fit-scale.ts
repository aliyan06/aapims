import { useEffect, useRef, useState } from "react";

/**
 * Scales a fixed-size design (e.g. a device frame) to fit the available
 * space in its parent without ever causing page scroll. The returned ref
 * must be attached to a flex child that has a definite size (min-h-0).
 */
export function useFitScale(designWidth: number, designHeight: number, padding = 40) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const compute = () => {
      const availableWidth = el.clientWidth - padding;
      const availableHeight = el.clientHeight - padding;
      if (availableWidth <= 0 || availableHeight <= 0) return;
      const next = Math.min(availableWidth / designWidth, availableHeight / designHeight, 1);
      setScale(Math.max(next, 0.2));
    };

    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(el);
    window.addEventListener("resize", compute);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [designWidth, designHeight, padding]);

  return { ref, scale };
}
