import { describe, expect, test } from "vitest";
import { createDefaultModulationState, evaluateAutoTimeline, mergeModulationState } from "../../src/modulation/engine";

describe("modulation engine", () => {
  test("createDefaultModulationState normalizes all non-time values", () => {
    const state = createDefaultModulationState(12);

    expect(state.time).toBe(12);
    expect(state.energy).toBeGreaterThanOrEqual(0);
    expect(state.energy).toBeLessThanOrEqual(1);
    expect(state.density).toBeGreaterThanOrEqual(0);
    expect(state.phase).toBeGreaterThanOrEqual(0);
    expect(state.breath).toBeGreaterThanOrEqual(0);
    expect(state.tension).toBeGreaterThanOrEqual(0);
    expect(state.coherence).toBeLessThanOrEqual(1);
  });

  test("mergeModulationState clamps override values without clamping time", () => {
    const state = mergeModulationState(createDefaultModulationState(2), {
      time: 90,
      energy: 2,
      density: -1,
      coherence: 0.4
    });

    expect(state.time).toBe(90);
    expect(state.energy).toBe(1);
    expect(state.density).toBe(0);
    expect(state.coherence).toBe(0.4);
  });

  test("evaluateAutoTimeline produces a looping 60 second modulation cycle", () => {
    const early = evaluateAutoTimeline(5, false);
    const late = evaluateAutoTimeline(65, false);
    const reduced = evaluateAutoTimeline(30, true);

    expect(late.energy).toBeCloseTo(early.energy);
    expect(reduced.phase).toBeLessThan(evaluateAutoTimeline(30, false).phase);
    expect(evaluateAutoTimeline(40, false).density).toBeGreaterThan(evaluateAutoTimeline(5, false).density);
  });
});
