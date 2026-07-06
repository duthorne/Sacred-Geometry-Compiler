import { describe, expect, test } from "vitest";
import { clampPlaybackSpeed } from "../../src/modulation/engine";

describe("playback speed", () => {
  test("clampPlaybackSpeed keeps animation speed in the calm control range", () => {
    expect(clampPlaybackSpeed(-1)).toBe(0.1);
    expect(clampPlaybackSpeed(0.45)).toBe(0.45);
    expect(clampPlaybackSpeed(4)).toBe(1.2);
  });
});
