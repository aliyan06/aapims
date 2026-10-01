import { useEffect, useState } from "react";

/**
 * Short, purely visual first-render loading flag used to show skeletons.
 * Purely cosmetic: no data fetching is involved.
 */
export function useFakeLoading(delay = 300): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return loading;
}
