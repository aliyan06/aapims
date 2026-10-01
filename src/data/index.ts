import { WORLD } from "./seed";
import type { DemoWorld } from "./types";

export * from "./types";
export * from "./taxonomy";
export * from "./lookups";
export {
  WORLD,
  DEMO_NOW,
  OPERATION_DATE,
  authority,
  operators,
  aircraft,
  agents,
  documents,
  applications,
  permits,
  revisions,
  audit,
  notifications,
  rbacRoles,
  rbacPermissions,
  counters,
  wallet,
} from "./seed";

/** Dev-only referential integrity checks. */
export function runDataValidation(world: DemoWorld = WORLD): string[] {
  const problems: string[] = [];
  const aircraftIds = new Set(world.aircraft.map((item) => item.id));
  const documentIds = new Set(world.documents.map((item) => item.id));
  const permitIds = new Set(world.permits.map((item) => item.id));

  for (const application of world.applications) {
    if (!aircraftIds.has(application.aircraftId)) {
      problems.push(
        `Application ${application.reference} references unknown aircraft ${application.aircraftId}`,
      );
    }
    for (const documentId of application.documentIds) {
      if (!documentIds.has(documentId)) {
        problems.push(
          `Application ${application.reference} references unknown document ${documentId}`,
        );
      }
    }
    if (application.permitId && !permitIds.has(application.permitId)) {
      problems.push(
        `Application ${application.reference} references unknown permit ${application.permitId}`,
      );
    }
  }

  return problems;
}
