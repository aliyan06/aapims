import { describe, expect, it } from "vitest";
import { STORY_IDS } from "@/data/types";
import { buildInitialState } from "./initial-state";
import type { AppState } from "./types";
import { SCENES, getScene } from "./scenes";

/** Replays a scene's transitions on a fresh initial state. */
function replay(sceneId: string): AppState {
  const scene = getScene(sceneId);
  if (!scene) throw new Error(`Unknown scene ${sceneId}`);
  const state = buildInitialState();
  state.clock.iso = scene.clock;
  scene.apply(state);
  return state;
}

function heroStatus(state: AppState) {
  return state.world.applications.find((item) => item.id === STORY_IDS.application)?.status;
}

describe("story scenes", () => {
  it("exposes a deterministic, unique scene list", () => {
    const ids = SCENES.map((scene) => scene.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(SCENES[0].id).toBe("scene-0");
  });

  it("replays each scene without throwing and reaches the expected hero status", () => {
    const expected: Record<string, string | undefined> = {
      "scene-0": "DRAFT",
      "scene-1": "DRAFT",
      "scene-2": "DRAFT",
      "scene-3": "SUBMITTED",
      "scene-4": "AWAITING FINANCE",
      "scene-5": "TECHNICAL REVIEW",
      "scene-6": "AWAITING FINAL APPROVAL",
      "scene-7": "ISSUED",
      "scene-8": "ISSUED",
      "scene-9": "REVISION REQUESTED",
      "scene-10": "REISSUED",
      "scene-11": "REISSUED",
    };

    for (const scene of SCENES) {
      const state = replay(scene.id);
      expect(heroStatus(state), scene.id).toBe(expected[scene.id]);
    }
  });

  it("issues the hero permit with the expected number at scene 7", () => {
    const state = replay("scene-7");
    expect(
      state.world.permits.some((permit) => permit.permitNumber === STORY_IDS.permitNumber),
    ).toBe(true);
  });
});
