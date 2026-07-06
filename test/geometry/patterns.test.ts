import { describe, expect, test } from "vitest";
import { evaluateScene } from "../../src/geometry/evaluator/evaluateScene";
import type { DynamicModifier, EvaluatedGeometryNode } from "../../src/geometry/types";
import { axialCoupling } from "../../src/patterns/axialCoupling";
import { radialFloral } from "../../src/patterns/radialFloral";
import { spiralField } from "../../src/patterns/spiralField";
import { triadicOrbital } from "../../src/patterns/triadicOrbital";
import { triuneAperture } from "../../src/patterns/triuneAperture";
import { vortexMandala } from "../../src/patterns/vortexMandala";
import { patterns } from "../../src/patterns";

function orbCentersAt(time: number): Array<{ id: string; center: readonly [number, number]; radius: number }> {
  return evaluateScene(vortexMandala, {
    time,
    energy: 0.5,
    density: 0.5,
    phase: 0.5,
    breath: 1,
    tension: 0.5,
    coherence: 0.9
  }).nodes
    .filter(
      (node): node is EvaluatedGeometryNode & { node: Extract<EvaluatedGeometryNode["node"], { type: "circle" }> } =>
        node.sourceId.startsWith("outer-orb-") && node.node.type === "circle"
    )
    .map((node) => ({
      id: node.sourceId,
      center: [node.node.center[0] + node.transform.translate[0], node.node.center[1] + node.transform.translate[1]] as const,
      radius: node.node.radius
    }));
}

function rotatePoint(point: readonly [number, number], origin: readonly [number, number], degrees: number): readonly [number, number] {
  const angle = (degrees * Math.PI) / 180;
  const x = point[0] - origin[0];
  const y = point[1] - origin[1];
  return [origin[0] + x * Math.cos(angle) - y * Math.sin(angle), origin[1] + x * Math.sin(angle) + y * Math.cos(angle)];
}

function transformedPoint(point: readonly [number, number], node: EvaluatedGeometryNode): readonly [number, number] {
  const scaled: readonly [number, number] = [
    node.transform.origin[0] + (point[0] - node.transform.origin[0]) * node.transform.scale[0],
    node.transform.origin[1] + (point[1] - node.transform.origin[1]) * node.transform.scale[1]
  ];
  const rotated = rotatePoint(scaled, node.transform.rotationOrigin ?? node.transform.origin, node.transform.rotation);
  return [rotated[0] + node.transform.translate[0], rotated[1] + node.transform.translate[1]];
}

describe("reference geometry patterns", () => {
  test("triadic orbital evaluates three resonant nodes plus static structure", () => {
    const evaluated = evaluateScene(triadicOrbital);

    expect(triadicOrbital.symmetry).toEqual({ type: "Cn", order: 3, center: [0.5, 0.5] });
    expect(evaluated.nodes.filter((node) => node.sourceId === "resonant-node")).toHaveLength(3);
    expect(evaluated.nodes.some((node) => node.sourceId === "central-seed")).toBe(true);
  });

  test("radial floral stores one petal prototype and evaluates the default repeats", () => {
    const petalSources = radialFloral.nodes.filter((node) => node.id === "petal-prototype");
    const evaluated = evaluateScene(radialFloral);

    expect(petalSources).toHaveLength(1);
    expect(radialFloral.operators?.find((operator) => operator.type === "radialRepeat")).toMatchObject({ count: 16 });
    expect(evaluated.nodes.filter((node) => node.sourceId === "petal-prototype")).toHaveLength(16);
  });

  test("spiral field uses a spiral primitive and terminal nodes", () => {
    const evaluated = evaluateScene(spiralField);

    expect(spiralField.nodes.some((node) => node.type === "spiral")).toBe(true);
    expect(evaluated.nodes.filter((node) => node.node.type === "point")).toHaveLength(3);
  });

  test("axial coupling uses mirror to create the opposing node structure", () => {
    const evaluated = evaluateScene(axialCoupling);

    expect(axialCoupling.operators?.some((operator) => operator.type === "mirror")).toBe(true);
    expect(evaluated.nodes.some((node) => node.id.startsWith("right-node:"))).toBe(true);
  });

  test("vortex mandala recreates the six-arm reference geometry through radial repeats", () => {
    const evaluated = evaluateScene(vortexMandala);

    expect(patterns.map((pattern) => pattern.id)).toContain("vortex-mandala");
    expect(vortexMandala.operators).toContainEqual({
      id: "vortex-arms",
      type: "radialRepeat",
      source: "vortex-arm-prototype",
      center: [0.5, 0.5],
      count: 6,
      startAngle: 0
    });
    expect(evaluated.nodes.filter((node) => node.sourceId === "vortex-arm-prototype")).toHaveLength(6);
    expect(evaluated.nodes.filter((node) => node.sourceId.startsWith("outer-orb-"))).toHaveLength(6);
    expect(vortexMandala.modifiers?.some((modifier) => modifier.type === "rotate" && modifier.target === "vortex-arms")).toBe(true);
  });

  test("vortex mandala staggers outer orb inward motion so center arrivals do not overlap", () => {
    const followModifiers = (vortexMandala.modifiers ?? []).filter(
      (modifier): modifier is Extract<DynamicModifier, { type: "followPath" }> =>
        modifier.type === "followPath" && modifier.target.startsWith("outer-orb-")
    );
    const phases = followModifiers.map((modifier) => modifier.phase ?? 0);

    expect(followModifiers).toHaveLength(6);
    expect(new Set(phases.map((phase) => phase.toFixed(3))).size).toBe(6);
    expect(followModifiers.every((modifier) => modifier.pingPong)).toBe(true);
    expect(followModifiers.every((modifier) => modifier.speed <= 0.08)).toBe(true);
    expect(followModifiers.every((modifier) => modifier.rotateWith?.speed === 1.15 && modifier.rotateWith.direction === "ccw")).toBe(true);
    expect(followModifiers.every((modifier) => modifier.path.length > 24)).toBe(true);
    expect(followModifiers.every((modifier) => Math.min(...modifier.path.map((point) => Math.hypot(point[0] - 0.5, point[1] - 0.5))) > 0.148)).toBe(true);
  });

  test("vortex mandala outer orbs never intersect while following rotating arms", () => {
    for (const time of Array.from({ length: 40 }, (_, index) => index * 12)) {
      const orbs = orbCentersAt(time);
      for (let i = 0; i < orbs.length; i += 1) {
        for (let j = i + 1; j < orbs.length; j += 1) {
          const distance = Math.hypot(orbs[i].center[0] - orbs[j].center[0], orbs[i].center[1] - orbs[j].center[1]);
          expect(distance).toBeGreaterThan(orbs[i].radius + orbs[j].radius);
        }
      }
    }
  });

  test("triune aperture recreates the threefold reference and moves every energy orb", () => {
    const evaluated = evaluateScene(triuneAperture, {
      time: 8,
      energy: 0.5,
      density: 0.5,
      phase: 0.5,
      breath: 1,
      tension: 0.5,
      coherence: 0.9
    });
    const modifierTargets = new Set((triuneAperture.modifiers ?? []).map((modifier) => modifier.target));
    const energyOrbs = evaluated.nodes.filter(
      (node) => (node.node.type === "circle" || node.node.type === "point") && node.node.tags?.includes("energy-source")
    );

    expect(patterns.map((pattern) => pattern.id)).toContain("triune-aperture");
    expect(triuneAperture.symmetry).toEqual({ type: "Cn", order: 3, center: [0.5, 0.5] });
    expect(triuneAperture.operators).toContainEqual({
      id: "triune-eye-ellipses",
      type: "radialRepeat",
      source: "eye-ellipse-prototype",
      center: [0.5, 0.5],
      count: 3,
      startAngle: 0
    });
    expect(triuneAperture.operators).toContainEqual({
      id: "triune-outer-orbs",
      type: "radialRepeat",
      source: "outer-orb-prototype",
      center: [0.5, 0.5],
      count: 3,
      startAngle: 0
    });
    expect(evaluated.nodes.filter((node) => node.sourceId === "outer-orb-prototype")).toHaveLength(3);
    expect(evaluated.nodes.filter((node) => node.sourceId === "inner-orb-prototype")).toHaveLength(3);
    expect(evaluated.nodes.filter((node) => node.sourceId === "small-orb-left-prototype")).toHaveLength(3);
    expect(evaluated.nodes.filter((node) => node.sourceId === "small-orb-right-prototype")).toHaveLength(3);
    expect(energyOrbs.every((node) => modifierTargets.has(node.sourceId) || [...modifierTargets].some((target) => node.id.startsWith(`${target}:`)))).toBe(true);

    const eyeSource = triuneAperture.nodes.find((node) => node.id === "eye-ellipse-prototype");
    const fillPulses = (triuneAperture.modifiers ?? []).filter(
      (modifier): modifier is Extract<DynamicModifier, { type: "fillPulse" }> => modifier.type === "fillPulse"
    );
    const rotateModifiers = (triuneAperture.modifiers ?? []).filter(
      (modifier): modifier is Extract<DynamicModifier, { type: "rotate" }> => modifier.type === "rotate" && modifier.target.startsWith("triune-")
    );
    const areaPulses = (triuneAperture.modifiers ?? []).filter(
      (modifier): modifier is Extract<DynamicModifier, { type: "areaPulse" }> => modifier.type === "areaPulse"
    );

    expect(eyeSource?.type).toBe("ellipse");
    if (eyeSource?.type === "ellipse") {
      expect(eyeSource.rotation).toBeCloseTo(Math.PI / 2);
      expect(eyeSource.radiusX).toBeLessThan(eyeSource.radiusY);
    }
    expect(fillPulses.map((modifier) => modifier.target)).toEqual([
      "small-orb-left-prototype",
      "small-orb-right-prototype",
      "small-orb-top-prototype",
      "small-orb-bottom-prototype"
    ]);
    expect(fillPulses.map((modifier) => modifier.phase)).toEqual([0, 0.25, 0.5, 0.75]);
    expect(rotateModifiers.every((modifier) => modifier.direction === "ccw" && modifier.speed === 0.42)).toBe(true);
    expect(areaPulses.map((modifier) => modifier.target)).toEqual([
      "outer-orb-prototype",
      "inner-orb-prototype",
      "small-orb-left-prototype",
      "small-orb-right-prototype",
      "small-orb-top-prototype",
      "small-orb-bottom-prototype"
    ]);
    expect(areaPulses.filter((modifier) => modifier.target !== "outer-orb-prototype").every((modifier) => modifier.minArea === 0.1 && modifier.maxArea === 1)).toBe(true);
  });

  test("triune aperture eye ellipses and eye-internal circles do not intersect", () => {
    const evaluated = evaluateScene(triuneAperture);
    const eyes = evaluated.nodes.filter(
      (node): node is EvaluatedGeometryNode & { node: Extract<EvaluatedGeometryNode["node"], { type: "ellipse" }> } =>
        node.sourceId === "eye-ellipse-prototype" && node.node.type === "ellipse"
    );
    const eyeCenters = eyes.map((node) => transformedPoint(node.node.center, node));
    const circles = evaluated.nodes
      .filter(
        (node): node is EvaluatedGeometryNode & { node: Extract<EvaluatedGeometryNode["node"], { type: "circle" }> } =>
          node.node.type === "circle" &&
          node.node.tags?.includes("energy-source") === true &&
          node.sourceId !== "triune-center"
      )
      .map((node) => ({ sourceId: node.sourceId, center: transformedPoint(node.node.center, node), radius: node.node.radius }));

    for (let i = 0; i < eyeCenters.length; i += 1) {
      for (let j = i + 1; j < eyeCenters.length; j += 1) {
        expect(Math.hypot(eyeCenters[i][0] - eyeCenters[j][0], eyeCenters[i][1] - eyeCenters[j][1])).toBeGreaterThan(0.31);
      }
    }

    for (let i = 0; i < circles.length; i += 1) {
      for (let j = i + 1; j < circles.length; j += 1) {
        const distance = Math.hypot(circles[i].center[0] - circles[j].center[0], circles[i].center[1] - circles[j].center[1]);
        expect(distance).toBeGreaterThan(circles[i].radius + circles[j].radius);
      }
    }
  });

  test("quadrant oracle recreates the imported SVG lattice with meditative node motion", () => {
    const pattern = patterns.find((scene) => scene.id === "quadrant-oracle");

    expect(pattern).toBeDefined();
    if (!pattern) {
      return;
    }

    const evaluated = evaluateScene(pattern);
    const modifiers = pattern.modifiers ?? [];
    const largeNodes = evaluated.nodes.filter((node) => node.sourceId === "large-orb-prototype");
    const sideSmallNodes = evaluated.nodes.filter(
      (node) => node.sourceId === "side-small-a-prototype" || node.sourceId === "side-small-b-prototype"
    );
    const centralCore = pattern.nodes.find((node) => node.id === "central-core");
    const centralBoundary = pattern.nodes.find((node) => node.id === "central-boundary");
    const fillPulses = modifiers.filter(
      (modifier): modifier is Extract<DynamicModifier, { type: "fillPulse" }> => modifier.type === "fillPulse"
    );

    expect(pattern.symmetry).toEqual({ type: "Cn", order: 4, center: [0.5, 0.5] });
    expect(pattern.operators).toContainEqual({
      id: "quadrant-repeat",
      type: "radialRepeat",
      source: "quadrant-branch-group",
      center: [0.5, 0.5],
      count: 4,
      startAngle: 0
    });
    expect(largeNodes).toHaveLength(4);
    expect(sideSmallNodes).toHaveLength(8);
    expect(centralCore).toMatchObject({
      type: "circle",
      center: [0.5, 0.5],
      radius: expect.closeTo(16.57031 / 144.58594, 5)
    });
    expect(centralBoundary).toMatchObject({
      type: "circle",
      center: [0.5, 0.5],
      radius: expect.closeTo(31.62891 / 144.58594, 5)
    });
    expect(modifiers).toContainEqual({ type: "breathe", target: "central-core", amplitude: 0.055, frequency: 0.24, phase: 0 });
    expect(modifiers).toContainEqual({ type: "areaPulse", target: "large-orb-prototype", minArea: 0.72, maxArea: 1, frequency: 0.14, phase: 0.18 });
    expect(fillPulses.map((modifier) => modifier.target)).toEqual(["side-small-a-prototype", "side-small-b-prototype"]);
    expect(fillPulses.map((modifier) => modifier.phase)).toEqual([0, 0.5]);
  });
});
