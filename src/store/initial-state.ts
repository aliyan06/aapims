import { WORLD } from "@/data";
import { DEMO_CLOCK_START } from "./clock";
import type { AppState } from "./types";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** A fresh, mutable copy of the entire demo world. */
export function buildInitialState(): AppState {
  return {
    meta: { activeRole: "operatorAdmin", currentScene: "scene-0", signedIn: false },
    clock: { iso: DEMO_CLOCK_START },
    world: clone(WORLD),
    ui: { toasts: [], lastActionLabel: "Demo ready" },
  };
}

/**
 * Development-only deep freeze of the seed data so accidental mutation of the
 * imported constant is caught instead of silently corrupting the world.
 */
function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.getOwnPropertyNames(value).forEach((key) => {
      deepFreeze((value as Record<string, unknown>)[key]);
    });
    Object.freeze(value);
  }
  return value;
}

if (import.meta.env.DEV) {
  deepFreeze(WORLD);
}
