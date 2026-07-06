import { describe, expect, test } from "vitest";
import { polygonPoints, sampleSpiral } from "../../src/geometry/primitives/pathBuilders";

describe("geometry primitives", () => {
  test("polygonPoints returns one vertex per side", () => {
    const points = polygonPoints({ center: [0.5, 0.5], radius: 0.25, sides: 6, rotation: 0 });

    expect(points).toHaveLength(6);
    expect(points[0][0]).toBeCloseTo(0.75);
    expect(points[0][1]).toBeCloseTo(0.5);
  });

  test("sampleSpiral samples a true archimedean curve", () => {
    const points = sampleSpiral({
      id: "spiral",
      type: "spiral",
      model: "archimedean",
      center: [0.5, 0.5],
      a: 0,
      b: 0.02,
      thetaStart: 0,
      thetaEnd: Math.PI,
      direction: "ccw",
      samples: 5
    });

    expect(points).toHaveLength(5);
    expect(points[0]).toEqual([0.5, 0.5]);
    expect(points[4][0]).toBeLessThan(0.5);
    expect(points[4][1]).toBeCloseTo(0.5);
  });
});
