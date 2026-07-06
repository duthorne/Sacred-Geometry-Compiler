import type { GeometryScene } from "../geometry/types";
import { brightSeed, dimSilver, graphite, silver } from "./styles";

export const radialFloral: GeometryScene = {
  id: "radial-floral",
  name: "Radial Floral",
  canvas: { coordinateSystem: "normalized", background: "#050606" },
  symmetry: { type: "Cn", order: 16, center: [0.5, 0.5] },
  nodes: [
    { id: "outer-polygon", type: "polygon", center: [0.5, 0.5], radius: 0.455, sides: 16, rotation: Math.PI / 16, style: graphite },
    {
      id: "petal-prototype",
      type: "bezier",
      points: [
        [0.5, 0.49],
        [0.545, 0.37],
        [0.555, 0.25],
        [0.5, 0.135],
        [0.445, 0.25],
        [0.455, 0.37],
        [0.5, 0.49]
      ],
      closed: true,
      role: "prototype",
      style: silver
    },
    { id: "inner-star", type: "polygon", center: [0.5, 0.5], radius: 0.205, sides: 8, rotation: Math.PI / 8, style: dimSilver },
    { id: "central-ring", type: "circle", center: [0.5, 0.5], radius: 0.088, tags: ["energy-source"], style: brightSeed },
    { id: "core-ring", type: "circle", center: [0.5, 0.5], radius: 0.044, style: silver },
    { id: "core-point", type: "point", position: [0.5, 0.5], radius: 0.007, tags: ["energy-source"], style: brightSeed }
  ],
  operators: [{ id: "petal-system", type: "radialRepeat", source: "petal-prototype", center: [0.5, 0.5], count: 16 }],
  modifiers: [
    { type: "densityWave", target: "petal-system", minDensity: 8, maxDensity: 32, frequency: 0.45 },
    { type: "rotate", target: "petal-system", speed: 1.4, direction: "ccw" },
    { type: "counterRotate", target: "inner-star", speed: 1.1 },
    { type: "breathe", target: "central-ring", amplitude: 0.06, frequency: 0.7 }
  ],
  relations: [
    { type: "contains", from: "outer-polygon", to: "petal-system" },
    { type: "repeats", from: "petal-system", to: "petal-prototype" },
    { type: "nested_in", from: "central-ring", to: "inner-star" }
  ]
};
