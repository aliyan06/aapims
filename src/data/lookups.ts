import type { DemoWorld } from "./types";

/**
 * Pure lookup helpers. They throw on unknown ids so dead references surface
 * early instead of rendering "undefined" in the demo.
 */

/**
 * Operators other than the logged-in operator are referenced by applications.
 * Their display names are resolved from this map, which keeps the seed compact
 * while still returning realistic data for the authority tables.
 */
export const EXTRA_OPERATOR_NAMES: Record<string, string> = {
  "op-savanna-air": "Savanna Air Charter",
  "op-atlas-cargo": "Atlas Cargo Airlines",
  "op-nile-wings": "Nile Wings",
  "op-coastal-express": "Coastal Express Airways",
};

export function operatorName(world: DemoWorld, id: string): string {
  if (world.operator.id === id) return world.operator.company;
  return EXTRA_OPERATOR_NAMES[id] ?? id;
}

export function getAircraft(world: DemoWorld, id: string) {
  const found = world.aircraft.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown aircraft id: ${id}`);
  return found;
}

export function getApplication(world: DemoWorld, id: string) {
  const found = world.applications.find((item) => item.id === id || item.reference === id);
  if (!found) throw new Error(`Unknown application id: ${id}`);
  return found;
}

export function getPermit(world: DemoWorld, id: string) {
  const found = world.permits.find((item) => item.id === id || item.permitNumber === id);
  if (!found) throw new Error(`Unknown permit id: ${id}`);
  return found;
}

export function getAgent(world: DemoWorld, id: string | null) {
  if (!id) return undefined;
  return world.agents.find((item) => item.id === id);
}

export function getDocument(world: DemoWorld, id: string) {
  const found = world.documents.find((item) => item.id === id);
  if (!found) throw new Error(`Unknown document id: ${id}`);
  return found;
}
