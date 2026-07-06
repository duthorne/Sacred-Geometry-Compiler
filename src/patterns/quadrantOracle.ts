import type { GeometryScene, GeometryStyle, Vec2 } from "../geometry/types";

const svgSize = 144.58594;
const center: Vec2 = [0.5, 0.5];

function n(value: number): number {
  return value / svgSize;
}

function p(x: number, y: number): Vec2 {
  return [n(x), n(y)];
}

const graphiteFill: GeometryStyle = {
  stroke: "rgba(52, 49, 53, 0.86)",
  fill: "rgba(34, 31, 34, 0.92)",
  lineWidth: 0.0015,
  alpha: 0.92,
  glow: 0.002
};

const branchStroke: GeometryStyle = {
  stroke: "rgba(48, 46, 50, 0.9)",
  lineWidth: 0.012,
  alpha: 0.86,
  glow: 0.002
};

const boundaryStroke: GeometryStyle = {
  stroke: "rgba(54, 51, 56, 0.9)",
  lineWidth: 0.011,
  alpha: 0.9,
  glow: 0.002
};

const centralCore: GeometryStyle = {
  stroke: "rgba(62, 58, 64, 0.76)",
  fill: "rgba(12, 11, 13, 0.98)",
  lineWidth: 0.0018,
  alpha: 0.96,
  glow: 0.003
};

export const quadrantOracle: GeometryScene = {
  id: "quadrant-oracle",
  name: "Quadrant Oracle",
  canvas: { coordinateSystem: "normalized", background: "#050606" },
  symmetry: { type: "Cn", order: 4, center },
  nodes: [
    {
      id: "central-boundary",
      type: "circle",
      center,
      radius: n(31.62891),
      style: boundaryStroke
    },
    {
      id: "central-core",
      type: "circle",
      center,
      radius: n(16.57031),
      tags: ["energy-source"],
      style: centralCore
    },
    {
      id: "diagonal-branch-prototype",
      type: "line",
      role: "prototype",
      from: p(95.76172, 48.82422),
      to: p(108.51172, 36.07813),
      style: branchStroke
    },
    {
      id: "top-branch-prototype",
      type: "bezier",
      role: "prototype",
      points: [p(88.66406, 16.98828), p(84.99219, 28.78906), p(89.19531, 40.67578), p(97.85156, 48.82422)],
      style: branchStroke
    },
    {
      id: "side-branch-prototype",
      type: "bezier",
      role: "prototype",
      points: [p(127.59766, 55.92188), p(118.09375, 58.59375), p(110.90625, 60.16016), p(102.72266, 55.88281)],
      style: branchStroke
    },
    {
      id: "large-orb-prototype",
      type: "circle",
      role: "prototype",
      center: p(119.13671, 25.44922),
      radius: n(16.57031),
      tags: ["energy-source"],
      style: graphiteFill
    },
    {
      id: "side-small-a-prototype",
      type: "circle",
      role: "prototype",
      center: p(90.62891, 8.60938),
      radius: n(8.61328),
      tags: ["energy-source"],
      style: graphiteFill
    },
    {
      id: "side-small-b-prototype",
      type: "circle",
      role: "prototype",
      center: p(135.97656, 53.95703),
      radius: n(8.61328),
      tags: ["energy-source"],
      style: graphiteFill
    }
  ],
  operators: [
    {
      id: "quadrant-branch-group",
      type: "group",
      children: [
        "diagonal-branch-prototype",
        "top-branch-prototype",
        "side-branch-prototype",
        "large-orb-prototype",
        "side-small-a-prototype",
        "side-small-b-prototype"
      ]
    },
    { id: "quadrant-repeat", type: "radialRepeat", source: "quadrant-branch-group", center, count: 4, startAngle: 0 }
  ],
  modifiers: [
    { type: "breathe", target: "central-core", amplitude: 0.055, frequency: 0.24, phase: 0 },
    { type: "areaPulse", target: "large-orb-prototype", minArea: 0.72, maxArea: 1, frequency: 0.14, phase: 0.18 },
    { type: "fillPulse", target: "side-small-a-prototype", fill: "rgba(34, 31, 34, 1)", frequency: 0.1, phase: 0 },
    { type: "fillPulse", target: "side-small-b-prototype", fill: "rgba(34, 31, 34, 1)", frequency: 0.1, phase: 0.5 },
    { type: "travelingPulse", target: "quadrant-repeat", speed: 0.035, width: 0.22, intensity: 0.16, loop: true }
  ],
  relations: [
    { type: "repeats", from: "quadrant-repeat", to: "quadrant-branch-group" },
    { type: "connects", from: "diagonal-branch-prototype", to: "large-orb-prototype" },
    { type: "attached_to", from: "side-small-a-prototype", to: "top-branch-prototype" },
    { type: "attached_to", from: "side-small-b-prototype", to: "side-branch-prototype" },
    { type: "nested_in", from: "central-core", to: "central-boundary" }
  ]
};
