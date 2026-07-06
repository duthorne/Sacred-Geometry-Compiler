import type { ModulationState } from "../geometry/types";
import { clamp, lerp } from "../utils/math";

type ModulationOverrides = Partial<ModulationState>;

const normalizedKeys = ["energy", "density", "phase", "breath", "tension", "coherence"] as const;

export function createDefaultModulationState(time = 0): ModulationState {
  return {
    time,
    energy: 0.34,
    density: 0.28,
    phase: 0.18,
    breath: 0.5 + 0.5 * Math.sin(time * 0.55),
    tension: 0.22,
    coherence: 0.88
  };
}

export function mergeModulationState(base: ModulationState, overrides: ModulationOverrides): ModulationState {
  const merged: ModulationState = { ...base, ...overrides };
  normalizedKeys.forEach((key) => {
    merged[key] = clamp(merged[key], 0, 1);
  });
  return merged;
}

export function clampPlaybackSpeed(speed: number): number {
  return clamp(speed, 0.1, 1.2);
}

export function evaluateAutoTimeline(time: number, reducedMotion: boolean): ModulationState {
  const cycleTime = ((time % 60) + 60) % 60;
  const segment = cycleTime / 60;

  const build = clamp((cycleTime - 10) / 24, 0, 1);
  const compression = clamp((cycleTime - 34) / 10, 0, 1);
  const release = clamp((cycleTime - 44) / 12, 0, 1);
  const dissolve = clamp((cycleTime - 54) / 6, 0, 1);
  const breath = 0.5 + 0.5 * Math.sin(cycleTime * (reducedMotion ? 0.12 : 0.42));
  const motionScale = reducedMotion ? 0.35 : 1;

  return mergeModulationState(createDefaultModulationState(time), {
    energy: lerp(0.24, 0.84, build) * (1 - dissolve * 0.28),
    density: lerp(0.18, 0.82, Math.max(build, release * 0.85)),
    phase: ((segment * motionScale + compression * 0.18) % 1 + 1) % 1,
    breath: reducedMotion ? lerp(0.46, 0.56, breath) : breath,
    tension: lerp(0.18, 0.86, compression) * (1 - release * 0.35),
    coherence: lerp(0.92, 0.58, Math.max(compression, dissolve * 0.8))
  });
}
