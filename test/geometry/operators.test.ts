import { describe, expect, test } from "vitest";
import { evaluateScene } from "../../src/geometry/evaluator/evaluateScene";
import type { GeometryScene } from "../../src/geometry/types";

describe("geometry operators", () => {
  test("radialRepeat expands one source node into evenly spaced instances", () => {
    const scene: GeometryScene = {
      id: "repeat-test",
      name: "Repeat Test",
      canvas: { coordinateSystem: "normalized", background: "#000" },
      nodes: [
        {
          id: "petal",
          type: "line",
          from: [0.5, 0.25],
          to: [0.5, 0.1],
          role: "prototype"
        }
      ],
      operators: [
        {
          id: "petal-system",
          type: "radialRepeat",
          source: "petal",
          center: [0.5, 0.5],
          count: 4
        }
      ]
    };

    const evaluated = evaluateScene(scene);

    expect(evaluated.nodes).toHaveLength(4);
    expect(evaluated.nodes.map((node) => node.sourceId)).toEqual(["petal", "petal", "petal", "petal"]);
    expect(evaluated.nodes.map((node) => Math.round(node.transform.rotation))).toEqual([0, 90, 180, 270]);
  });

  test("mirror reflects source geometry across the requested axis", () => {
    const scene: GeometryScene = {
      id: "mirror-test",
      name: "Mirror Test",
      canvas: { coordinateSystem: "normalized", background: "#000" },
      nodes: [{ id: "left", type: "circle", center: [0.35, 0.5], radius: 0.1 }],
      operators: [{ id: "right", type: "mirror", source: "left", axis: "vertical", origin: [0.5, 0.5] }]
    };

    const evaluated = evaluateScene(scene);
    const mirrored = evaluated.nodes.find((node) => node.id === "right:left");

    expect(evaluated.nodes).toHaveLength(2);
    expect(mirrored?.node.type).toBe("circle");
    expect(mirrored?.transform.scale).toEqual([-1, 1]);
    expect(mirrored?.transform.origin).toEqual([0.5, 0.5]);
  });

  test("group lets an operator expand multiple child nodes as one source", () => {
    const scene: GeometryScene = {
      id: "group-test",
      name: "Group Test",
      canvas: { coordinateSystem: "normalized", background: "#000" },
      nodes: [
        { id: "ring", type: "circle", center: [0.5, 0.25], radius: 0.05, role: "prototype" },
        { id: "axis", type: "line", from: [0.5, 0.25], to: [0.5, 0.35], role: "prototype" }
      ],
      operators: [
        { id: "node-group", type: "group", children: ["ring", "axis"] },
        { id: "group-repeat", type: "radialRepeat", source: "node-group", center: [0.5, 0.5], count: 3 }
      ]
    };

    const evaluated = evaluateScene(scene);

    expect(evaluated.nodes).toHaveLength(6);
    expect(evaluated.nodes.filter((node) => node.sourceId === "ring")).toHaveLength(3);
    expect(evaluated.nodes.filter((node) => node.sourceId === "axis")).toHaveLength(3);
  });
});
