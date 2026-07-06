import { describe, expect, test } from "vitest";
import { evaluateScene } from "../../src/geometry/evaluator/evaluateScene";
import type { ModulationState } from "../../src/geometry/types";
import { axialCoupling } from "../../src/patterns/axialCoupling";
import { spiralField } from "../../src/patterns/spiralField";

const activeModulation: ModulationState = {
  time: 1,
  energy: 0.7,
  density: 0.5,
  phase: 0.25,
  breath: 1,
  tension: 0.4,
  coherence: 0.9
};

function translationMagnitude(translate: readonly [number, number]): number {
  return Math.hypot(translate[0], translate[1]);
}

function movedPoint(base: readonly [number, number], translate: readonly [number, number]): readonly [number, number] {
  return [base[0] + translate[0], base[1] + translate[1]];
}

function distanceFromCenter(point: readonly [number, number]): number {
  return Math.hypot(point[0] - 0.5, point[1] - 0.5);
}

describe("pattern motion refinements", () => {
  test("spiral field terminal and center circles have spin translation", () => {
    const evaluated = evaluateScene(spiralField, activeModulation);
    const outerTerminal = evaluated.nodes.find((node) => node.sourceId === "outer-terminal");
    const innerTerminal = evaluated.nodes.find((node) => node.sourceId === "inner-terminal");
    const centerSingularity = evaluated.nodes.find((node) => node.sourceId === "center-singularity");

    expect(translationMagnitude(outerTerminal?.transform.translate ?? [0, 0])).toBeGreaterThan(0.004);
    expect(translationMagnitude(innerTerminal?.transform.translate ?? [0, 0])).toBeGreaterThan(0.002);
    expect(translationMagnitude(centerSingularity?.transform.translate ?? [0, 0])).toBeGreaterThan(0.001);
  });

  test("spiral field edge circles spiral inward and outward on the main spiral path", () => {
    const early = evaluateScene(spiralField, { ...activeModulation, time: 0 });
    const later = evaluateScene(spiralField, { ...activeModulation, time: 2.4 });
    const outerEarly = early.nodes.find((node) => node.sourceId === "outer-terminal");
    const outerLater = later.nodes.find((node) => node.sourceId === "outer-terminal");
    const innerLater = later.nodes.find((node) => node.sourceId === "inner-terminal");

    const earlyPosition = movedPoint([0.087, 0.5], outerEarly?.transform.translate ?? [0, 0]);
    const laterPosition = movedPoint([0.087, 0.5], outerLater?.transform.translate ?? [0, 0]);

    expect(translationMagnitude(outerLater?.transform.translate ?? [0, 0])).toBeGreaterThan(0.08);
    expect(translationMagnitude(innerLater?.transform.translate ?? [0, 0])).toBeGreaterThan(0.03);
    expect(Math.abs(distanceFromCenter(laterPosition) - distanceFromCenter(earlyPosition))).toBeGreaterThan(0.04);
  });

  test("spiral field spirals rotate around the shared center", () => {
    const evaluated = evaluateScene(spiralField, activeModulation);
    const primary = evaluated.nodes.find((node) => node.sourceId === "primary-spiral");
    const counter = evaluated.nodes.find((node) => node.sourceId === "counter-spiral");

    expect(primary?.transform.rotationOrigin).toEqual([0.5, 0.5]);
    expect(counter?.transform.rotationOrigin).toEqual([0.5, 0.5]);
    expect(Math.abs(primary?.transform.rotation ?? 0)).toBeGreaterThan(1);
    expect(Math.abs(counter?.transform.rotation ?? 0)).toBeGreaterThan(1);
  });

  test("axial coupling circle nodes have rhythmic scale changes", () => {
    const evaluated = evaluateScene(axialCoupling, activeModulation);
    const circleTargets = ["left-node", "left-core", "right-node:left-node", "right-core:left-core"];

    circleTargets.forEach((id) => {
      const node = evaluated.nodes.find((evaluatedNode) => evaluatedNode.id === id);
      expect(node?.transform.scale[1]).not.toBeCloseTo(1);
    });
  });

  test("axial coupling removes added spiral tracks and keeps edge circles on tight slow orbits", () => {
    const early = evaluateScene(axialCoupling, { ...activeModulation, time: 0 });
    const later = evaluateScene(axialCoupling, { ...activeModulation, time: 1.8 });
    const leftEarly = early.nodes.find((node) => node.sourceId === "left-edge-orbiter");
    const leftLater = later.nodes.find((node) => node.sourceId === "left-edge-orbiter");
    const rightLater = later.nodes.find((node) => node.id === "right-edge-orbiter:left-edge-orbiter");
    const edgeOrbitModifiers = axialCoupling.modifiers?.filter(
      (modifier) => modifier.type === "orbit" && modifier.target.includes("edge-orbiter")
    );

    expect(axialCoupling.nodes.some((node) => node.id.includes("spiral-track"))).toBe(false);
    expect(axialCoupling.operators?.some((operator) => operator.type === "mirror" && operator.source.includes("spiral-track"))).toBe(false);
    expect(edgeOrbitModifiers).toHaveLength(2);
    edgeOrbitModifiers?.forEach((modifier) => {
      if (modifier.type === "orbit") {
        expect(modifier.radius).toBeLessThanOrEqual(0.032);
        expect(Math.abs(modifier.speed)).toBeLessThanOrEqual(0.65);
      }
    });
    expect(translationMagnitude(leftLater?.transform.translate ?? [0, 0])).toBeLessThan(0.11);
    expect(translationMagnitude(rightLater?.transform.translate ?? [0, 0])).toBeLessThan(0.11);
    expect(leftLater?.transform.translate).not.toEqual(leftEarly?.transform.translate);
  });
});
