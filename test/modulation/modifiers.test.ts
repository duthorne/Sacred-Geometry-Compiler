import { describe, expect, test } from "vitest";
import { evaluateScene } from "../../src/geometry/evaluator/evaluateScene";
import type { GeometryScene, ModulationState } from "../../src/geometry/types";

const modulation: ModulationState = {
  time: Math.PI / 2,
  energy: 0.7,
  density: 0.5,
  phase: 0.25,
  breath: 1,
  tension: 0.4,
  coherence: 0.9
};

describe("dynamic modifiers", () => {
  test("breathe scales the target from the shared modulation state", () => {
    const scene: GeometryScene = {
      id: "breathe-test",
      name: "Breathe Test",
      canvas: { coordinateSystem: "normalized", background: "#000" },
      nodes: [{ id: "ring", type: "circle", center: [0.5, 0.5], radius: 0.2 }],
      modifiers: [{ type: "breathe", target: "ring", amplitude: 0.1, frequency: 1 }]
    };

    const evaluated = evaluateScene(scene, modulation);

    expect(evaluated.nodes[0].transform.scale[0]).toBeCloseTo(1.1);
    expect(evaluated.nodes[0].transform.scale[1]).toBeCloseTo(1.1);
  });

  test("rotate adds directional rotation to repeated instances", () => {
    const scene: GeometryScene = {
      id: "rotate-test",
      name: "Rotate Test",
      canvas: { coordinateSystem: "normalized", background: "#000" },
      nodes: [{ id: "node", type: "circle", center: [0.5, 0.25], radius: 0.05, role: "prototype" }],
      operators: [{ id: "triad", type: "radialRepeat", source: "node", center: [0.5, 0.5], count: 3 }],
      modifiers: [{ type: "rotate", target: "triad", speed: 10, direction: "ccw" }]
    };

    const evaluated = evaluateScene(scene, modulation);

    expect(evaluated.nodes.map((node) => Math.round(node.transform.rotation))).toEqual([16, 136, 256]);
  });

  test("densityWave changes radial repeat count from modulation density", () => {
    const scene: GeometryScene = {
      id: "density-test",
      name: "Density Test",
      canvas: { coordinateSystem: "normalized", background: "#000" },
      nodes: [{ id: "line", type: "line", from: [0.5, 0.3], to: [0.5, 0.2], role: "prototype" }],
      operators: [{ id: "rays", type: "radialRepeat", source: "line", center: [0.5, 0.5], count: 8 }],
      modifiers: [{ type: "densityWave", target: "rays", minDensity: 8, maxDensity: 32, frequency: 1 }]
    };

    const evaluated = evaluateScene(scene, modulation);

    expect(evaluated.nodes).toHaveLength(32);
  });

  test("followPath moves a target along a path and reverses in ping-pong mode", () => {
    const scene: GeometryScene = {
      id: "follow-path-test",
      name: "Follow Path Test",
      canvas: { coordinateSystem: "normalized", background: "#000" },
      nodes: [{ id: "traveler", type: "circle", center: [0.2, 0.5], radius: 0.03 }],
      modifiers: [
        {
          type: "followPath",
          target: "traveler",
          path: [
            [0.2, 0.5],
            [0.8, 0.5]
          ],
          speed: 1,
          phase: 0,
          pingPong: true
        }
      ]
    };

    const outward = evaluateScene(scene, { ...modulation, time: 1 });
    const returning = evaluateScene(scene, { ...modulation, time: 1.5 });

    expect(outward.nodes[0].transform.translate).toEqual([0.6000000000000001, 0]);
    expect(returning.nodes[0].transform.translate[0]).toBeCloseTo(0.3);
    expect(returning.nodes[0].transform.translate[1]).toBeCloseTo(0);
  });

  test("followPath can rotate the sampled path with its arm field", () => {
    const scene: GeometryScene = {
      id: "rotating-follow-path-test",
      name: "Rotating Follow Path Test",
      canvas: { coordinateSystem: "normalized", background: "#000" },
      nodes: [{ id: "traveler", type: "circle", center: [0.8, 0.5], radius: 0.03 }],
      modifiers: [
        {
          type: "followPath",
          target: "traveler",
          path: [[0.8, 0.5]],
          speed: 0,
          phase: 0,
          pingPong: true,
          rotateWith: { center: [0.5, 0.5], speed: 90, direction: "ccw" }
        }
      ]
    };

    const evaluated = evaluateScene(scene, { ...modulation, time: 1 });

    expect(evaluated.nodes[0].transform.translate[0]).toBeCloseTo(-0.3);
    expect(evaluated.nodes[0].transform.translate[1]).toBeCloseTo(0.3);
  });

  test("fillPulse slowly changes a circle from filled to unfilled", () => {
    const scene: GeometryScene = {
      id: "fill-pulse-test",
      name: "Fill Pulse Test",
      canvas: { coordinateSystem: "normalized", background: "#000" },
      nodes: [{ id: "small", type: "circle", center: [0.5, 0.5], radius: 0.03, style: { stroke: "rgba(80,80,80,1)" } }],
      modifiers: [{ type: "fillPulse", target: "small", fill: "rgba(50, 48, 52, 1)", frequency: 0.25, phase: 0 }]
    };

    const evaluated = evaluateScene(scene, { ...modulation, time: 0 });

    expect(evaluated.nodes[0].node.style?.fill).toBe("rgba(50, 48, 52, 0.500)");
  });

  test("areaPulse scales circle area from 10 percent to 100 percent around its own center", () => {
    const scene: GeometryScene = {
      id: "area-pulse-test",
      name: "Area Pulse Test",
      canvas: { coordinateSystem: "normalized", background: "#000" },
      nodes: [{ id: "orb", type: "circle", center: [0.4, 0.5], radius: 0.04 }],
      modifiers: [{ type: "areaPulse", target: "orb", minArea: 0.1, maxArea: 1, frequency: 0.25, phase: 0.25 }]
    };

    const maxArea = evaluateScene(scene, { ...modulation, time: 0 });
    const minArea = evaluateScene(scene, { ...modulation, time: 2 });

    expect(maxArea.nodes[0].transform.scale[0]).toBeCloseTo(1);
    expect(maxArea.nodes[0].transform.origin).toEqual([0.4, 0.5]);
    expect(minArea.nodes[0].transform.scale[0]).toBeCloseTo(Math.sqrt(0.1));
    expect(minArea.nodes[0].transform.origin).toEqual([0.4, 0.5]);
  });

  test("areaPulse keeps radial repeat rotation around the repeat center", () => {
    const scene: GeometryScene = {
      id: "repeated-area-pulse-test",
      name: "Repeated Area Pulse Test",
      canvas: { coordinateSystem: "normalized", background: "#000" },
      nodes: [{ id: "orb", type: "circle", center: [0.7, 0.5], radius: 0.04, role: "prototype" }],
      operators: [{ id: "orbs", type: "radialRepeat", source: "orb", center: [0.5, 0.5], count: 4 }],
      modifiers: [{ type: "areaPulse", target: "orb", minArea: 0.25, maxArea: 1, frequency: 0.25, phase: 0.25 }]
    };

    const evaluated = evaluateScene(scene, { ...modulation, time: 1 });

    expect(evaluated.nodes[1].transform.origin).toEqual([0.7, 0.5]);
    expect(evaluated.nodes[1].transform.rotationOrigin).toEqual([0.5, 0.5]);
  });
});
