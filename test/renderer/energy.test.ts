import { describe, expect, test } from "vitest";
import { evaluateScene } from "../../src/geometry/evaluator/evaluateScene";
import { createDefaultModulationState } from "../../src/modulation/engine";
import { collectEnergyNodes } from "../../src/renderer/webgl/energyNodes";
import { createEnergyUniformSnapshot } from "../../src/renderer/webgl/uniforms";
import { triadicOrbital } from "../../src/patterns/triadicOrbital";

describe("energy field inputs", () => {
  test("collectEnergyNodes extracts tagged geometric source centers", () => {
    const evaluated = evaluateScene(triadicOrbital, createDefaultModulationState(0));
    const nodes = collectEnergyNodes(evaluated);

    expect(nodes.length).toBeGreaterThanOrEqual(4);
    expect(nodes[0]).toMatchObject({ amplitude: expect.any(Number), frequency: expect.any(Number), phase: expect.any(Number) });
  });

  test("createEnergyUniformSnapshot forwards modulation into shader-safe values", () => {
    const modulation = createDefaultModulationState(8);
    const evaluated = evaluateScene(triadicOrbital, modulation);
    const snapshot = createEnergyUniformSnapshot(modulation, collectEnergyNodes(evaluated));

    expect(snapshot.time).toBe(8);
    expect(snapshot.energy).toBeGreaterThanOrEqual(0);
    expect(snapshot.energy).toBeLessThanOrEqual(1);
    expect(snapshot.nodeCount).toBeLessThanOrEqual(8);
    expect(snapshot.nodeData).toHaveLength(8 * 4);
  });
});
