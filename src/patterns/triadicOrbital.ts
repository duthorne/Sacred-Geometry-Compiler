import type { GeometryScene } from "../geometry/types";
import { brightSeed, dimSilver, graphite, silver } from "./styles";

export const triadicOrbital: GeometryScene = {
  id: "triadic-orbital",
  name: "Triadic Orbital",
  canvas: { coordinateSystem: "normalized", background: "#050606" },
  symmetry: { type: "Cn", order: 3, center: [0.5, 0.5] },
  nodes: [
    { id: "outer-boundary", type: "circle", center: [0.5, 0.5], radius: 0.44, style: silver },
    { id: "inner-field", type: "circle", center: [0.5, 0.5], radius: 0.31, style: graphite },
    { id: "middle-field", type: "circle", center: [0.5, 0.5], radius: 0.22, style: dimSilver },
    { id: "central-seed", type: "circle", center: [0.5, 0.5], radius: 0.045, tags: ["energy-source"], style: brightSeed },
    { id: "seed-point", type: "point", position: [0.5, 0.5], radius: 0.009, tags: ["energy-source"], style: brightSeed },
    { id: "resonant-node", type: "circle", center: [0.5, 0.255], radius: 0.082, role: "prototype", tags: ["energy-source"], style: silver },
    { id: "node-nest-a", type: "circle", center: [0.5, 0.255], radius: 0.055, role: "prototype", style: dimSilver },
    { id: "node-nest-b", type: "circle", center: [0.5, 0.255], radius: 0.028, role: "prototype", style: graphite },
    { id: "node-link", type: "line", from: [0.5, 0.34], to: [0.5, 0.455], role: "prototype", style: graphite }
  ],
  operators: [
    { id: "triad-nodes", type: "radialRepeat", source: "resonant-node", center: [0.5, 0.5], count: 3, startAngle: 0 },
    { id: "triad-nests-a", type: "radialRepeat", source: "node-nest-a", center: [0.5, 0.5], count: 3, startAngle: 0 },
    { id: "triad-nests-b", type: "radialRepeat", source: "node-nest-b", center: [0.5, 0.5], count: 3, startAngle: 0 },
    { id: "triad-links", type: "radialRepeat", source: "node-link", center: [0.5, 0.5], count: 3, startAngle: 0 }
  ],
  modifiers: [
    { type: "breathe", target: "outer-boundary", amplitude: 0.035, frequency: 0.55 },
    { type: "rotate", target: "triad-nodes", speed: 3.2, direction: "ccw" },
    { type: "rotate", target: "triad-nests-a", speed: 2.2, direction: "ccw" },
    { type: "counterRotate", target: "triad-nests-b", speed: 2.8 },
    { type: "phaseShift", target: "triad-links", amount: 0.08, source: "energy" }
  ],
  relations: [
    { type: "contains", from: "outer-boundary", to: "central-seed" },
    { type: "orbits", from: "resonant-node", to: "central-seed" },
    { type: "repeats", from: "triad-nodes", to: "resonant-node" },
    { type: "nested_in", from: "node-nest-a", to: "resonant-node" }
  ]
};
