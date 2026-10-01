import { createFileRoute } from "@tanstack/react-router";
import { ApplyWizard } from "@/components/operator/ApplyWizard";

export const Route = createFileRoute("/operator/apply")({
  component: ApplyWizard,
});
