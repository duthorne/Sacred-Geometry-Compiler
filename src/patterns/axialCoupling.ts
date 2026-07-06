import type { GeometryScene } from "../geometry/types";
import { brightSeed, dimSilver, graphite, silver } from "./styles";

export const axialCoupling: GeometryScene = {
  id: "axial-coupling",
  name: "Axial Coupling",
  canvas: { coordinateSystem: "normalized", background: "#050606" },
  symmetry: { type: "bilateral", axis: "vertical", origin: [0.5, 0.5] },
  nodes: [
    { id: "left-node", type: "circle", center: [0.315, 0.5], radius: 0.115, tags: ["energy-source"], style: silver },
    { id: "left-core", type: "circle", center: [0.315, 0.5], radius: 0.052, tags: ["energy-source"], style: brightSeed },
    { id: "left-edge-orbiter", type: "circle", center: [0.286, 0.5], radius: 0.016, tags: ["energy-source"], style: brightSeed },
    { id: "left-outer-arc", type: "arc", center: [0.315, 0.5], radius: 0.2, startAngle: Math.PI * 0.58, endAngle: Math.PI * 1.42, style: dimSilver },
    { id: "left-inner-arc", type: "arc", center: [0.315, 0.5], radius: 0.16, startAngle: Math.PI * 0.64, endAngle: Math.PI * 1.36, style: graphite },
    { id: "bridge", type: "line", from: [0.43, 0.5], to: [0.57, 0.5], style: silver },
    { id: "bridge-field", type: "ellipse", center: [0.5, 0.5], radiusX: 0.12, radiusY: 0.036, style: graphite },
    { id: "bridge-seed", type: "point", position: [0.5, 0.5], radius: 0.008, tags: ["energy-source"], style: brightSeed }
  ],
  operators: [
    { id: "right-node", type: "mirror", source: "left-node", axis: "vertical", origin: [0.5, 0.5] },
    { id: "right-core", type: "mirror", source: "left-core", axis: "vertical", origin: [0.5, 0.5] },
    { id: "right-edge-orbiter", type: "mirror", source: "left-edge-orbiter", axis: "vertical", origin: [0.5, 0.5] },
    { id: "right-outer-arc", type: "mirror", source: "left-outer-arc", axis: "vertical", origin: [0.5, 0.5] },
    { id: "right-inner-arc", type: "mirror", source: "left-inner-arc", axis: "vertical", origin: [0.5, 0.5] }
  ],
  modifiers: [
    { type: "breathe", target: "left-node", amplitude: 0.035, frequency: 1.05, phase: 0 },
    { type: "breathe", target: "right-node", amplitude: 0.03, frequency: 1.05, phase: 0.8 },
    { type: "breathe", target: "left-core", amplitude: 0.075, frequency: 1.28, phase: 0.35 },
    { type: "breathe", target: "right-core", amplitude: 0.06, frequency: 1.28, phase: 1.2 },
    { type: "orbit", target: "left-edge-orbiter", center: [0.315, 0.5], radius: 0.029, speed: 0.52, phase: 0.08 },
    { type: "orbit", target: "right-edge-orbiter", center: [0.685, 0.5], radius: 0.029, speed: -0.52, phase: 0.58 },
    { type: "breathe", target: "left-edge-orbiter", amplitude: 0.055, frequency: 1.42, phase: 0.2 },
    { type: "breathe", target: "right-edge-orbiter", amplitude: 0.055, frequency: 1.42, phase: 1.4 },
    { type: "orbit", target: "left-core", center: [0.315, 0.5], radius: 0.004, speed: 1.8, phase: 0 },
    { type: "orbit", target: "right-core", center: [0.685, 0.5], radius: 0.004, speed: -1.8, phase: 0.5 },
    { type: "phaseShift", target: "left-core", amount: 0.12, source: "energy" },
    { type: "phaseShift", target: "right-core", amount: -0.12, source: "energy" },
    { type: "breathe", target: "bridge-field", amplitude: 0.045, frequency: 0.85 },
    { type: "travelingPulse", target: "bridge", speed: 0.32, width: 0.16, intensity: 0.8, loop: true }
  ],
  relations: [
    { type: "mirrors", from: "left-node", to: "right-node" },
    { type: "orbits", from: "left-edge-orbiter", to: "left-node" },
    { type: "orbits", from: "right-edge-orbiter", to: "right-node" },
    { type: "connects", from: "left-node", to: "bridge" },
    { type: "connects", from: "bridge", to: "right-node" },
    { type: "touches", from: "bridge-field", to: "bridge" }
  ]
};
