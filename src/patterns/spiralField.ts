import type { GeometryScene } from "../geometry/types";
import { brightSeed, dimSilver, graphite, silver } from "./styles";

export const spiralField: GeometryScene = {
  id: "spiral-field",
  name: "Spiral Field",
  canvas: { coordinateSystem: "normalized", background: "#050606" },
  symmetry: { type: "none" },
  nodes: [
    {
      id: "primary-spiral",
      type: "spiral",
      model: "archimedean",
      center: [0.5, 0.5],
      a: 0.012,
      b: 0.015,
      thetaStart: 0,
      thetaEnd: Math.PI * 8.5,
      direction: "ccw",
      samples: 240,
      tags: ["energy-source"],
      style: silver
    },
    {
      id: "counter-spiral",
      type: "spiral",
      model: "archimedean",
      center: [0.5, 0.5],
      a: 0.014,
      b: 0.012,
      thetaStart: Math.PI * 0.25,
      thetaEnd: Math.PI * 7,
      direction: "cw",
      samples: 210,
      style: graphite
    },
    { id: "outer-terminal", type: "point", position: [0.087, 0.5], radius: 0.02, tags: ["energy-source"], style: brightSeed },
    { id: "inner-terminal", type: "point", position: [0.512, 0.5], radius: 0.01, tags: ["energy-source"], style: brightSeed },
    { id: "center-singularity", type: "point", position: [0.5, 0.5], radius: 0.014, tags: ["energy-source"], style: silver },
    { id: "containment-ring", type: "circle", center: [0.5, 0.5], radius: 0.42, style: dimSilver }
  ],
  modifiers: [
    { type: "rotate", target: "primary-spiral", speed: 7.5, direction: "ccw", origin: [0.5, 0.5] },
    { type: "rotate", target: "counter-spiral", speed: 4.8, direction: "cw", origin: [0.5, 0.5] },
    { type: "travelingPulse", target: "primary-spiral", speed: 0.12, width: 0.18, intensity: 0.9, loop: true },
    { type: "compress", target: "primary-spiral", amount: 0.035, center: [0.5, 0.5] },
    { type: "expand", target: "counter-spiral", amount: 0.022, center: [0.5, 0.5] },
    { type: "breathe", target: "containment-ring", amplitude: 0.025, frequency: 0.45 },
    {
      type: "spiralOrbit",
      target: "outer-terminal",
      center: [0.5, 0.5],
      minRadius: 0.055,
      maxRadius: 0.415,
      angularSpeed: 1.15,
      radialFrequency: 0.42,
      phase: 0.02
    },
    {
      type: "spiralOrbit",
      target: "inner-terminal",
      center: [0.5, 0.5],
      minRadius: 0.018,
      maxRadius: 0.18,
      angularSpeed: -1.9,
      radialFrequency: 0.52,
      phase: 0.44
    },
    { type: "orbit", target: "center-singularity", center: [0.5, 0.5], radius: 0.0036, speed: 2.7, phase: 0.66 },
    { type: "breathe", target: "outer-terminal", amplitude: 0.08, frequency: 1.25, phase: 0.4 },
    { type: "breathe", target: "inner-terminal", amplitude: 0.06, frequency: 1.6, phase: 1.1 },
    { type: "breathe", target: "center-singularity", amplitude: 0.05, frequency: 1.9, phase: 1.7 }
  ],
  relations: [
    { type: "connects", from: "primary-spiral", to: "outer-terminal" },
    { type: "connects", from: "primary-spiral", to: "center-singularity" },
    { type: "nested_in", from: "center-singularity", to: "containment-ring" }
  ]
};
