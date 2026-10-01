import { useRouter } from "@tanstack/react-router";

/**
 * Back handler for mobile screens inside the device frame.
 *
 * Uses the in-app history when there is somewhere to return to (so it behaves
 * like a native back button across the shared screens), and falls back to an
 * explicit destination when the screen was opened directly (deep link,
 * presenter jump, page refresh) and history cannot go back.
 */
export function useAppBack(fallback: () => void) {
  const router = useRouter();

  return () => {
    if (router.history.canGoBack()) {
      router.history.back();
    } else {
      fallback();
    }
  };
}
