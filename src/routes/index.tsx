import { createFileRoute, redirect } from "@tanstack/react-router";

// The sign-in page is the main entry point (features.md §1 / lovable-prompt.md §5).
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
});
