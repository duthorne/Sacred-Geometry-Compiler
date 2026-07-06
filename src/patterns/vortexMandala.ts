import type { GeometryScene, GeometryStyle, Vec2 } from "../geometry/types";
import { brightSeed, dimSilver } from "./styles";

const deepGraphite: GeometryStyle = {
  stroke: "rgba(49, 47, 50, 0.82)",
  fill: "rgba(35, 33, 36, 0.86)",
  lineWidth: 0.0016,
  alpha: 0.92,
  glow: 0.002
};

const vortexArm: GeometryStyle = {
  stroke: "rgba(54, 52, 56, 0.86)",
  lineWidth: 0.017,
  alpha: 0.86,
  glow: 0.003
};

const armPath: readonly Vec2[] = [
  [0.5, 0.5],
  [0.56, 0.395],
  [0.63, 0.25],
  [0.78, 0.205]
];

const vortexRotation = { center: [0.5, 0.5] as Vec2, speed: 1.15, direction: "ccw" as const };
const outerOrbRadius = 0.074;
const innerOrbClearance = 0.22;

function cubicBezierPoint(points: readonly Vec2[], t: number): Vec2 {
  const [p0, p1, p2, p3] = points;
  const inv = 1 - t;
  return [
    inv ** 3 * p0[0] + 3 * inv ** 2 * t * p1[0] + 3 * inv * t ** 2 * p2[0] + t ** 3 * p3[0],
    inv ** 3 * p0[1] + 3 * inv ** 2 * t * p1[1] + 3 * inv * t ** 2 * p2[1] + t ** 3 * p3[1]
  ];
}

function distanceFromCenter(point: Vec2): number {
  return Math.hypot(point[0] - 0.5, point[1] - 0.5);
}

function sampledArmPath(): Vec2[] {
  return Array.from({ length: 97 }, (_, index) => cubicBezierPoint(armPath, index / 96)).filter(
    (point) => distanceFromCenter(point) >= innerOrbClearance
  );
}

function rotatePoint(point: Vec2, angle: number): Vec2 {
  const x = point[0] - 0.5;
  const y = point[1] - 0.5;
  return [0.5 + x * Math.cos(angle) - y * Math.sin(angle), 0.5 + x * Math.sin(angle) + y * Math.cos(angle)];
}

function rotatedArmPath(index: number): Vec2[] {
  const angle = (Math.PI * 2 * index) / 6;
  return sampledArmPath().map((point) => rotatePoint(point, angle));
}

export const vortexMandala: GeometryScene = {
  id: "vortex-mandala",
  name: "Vortex Mandala",
  canvas: { coordinateSystem: "normalized", background: "#050606" },
  symmetry: { type: "Cn", order: 6, center: [0.5, 0.5] },
  nodes: [
    {
      id: "vortex-arm-prototype",
      type: "bezier",
      role: "prototype",
      points: armPath,
      style: vortexArm
    },
    ...Array.from({ length: 6 }, (_, index) => ({
      id: `outer-orb-${index + 1}`,
      type: "circle" as const,
      center: rotatedArmPath(index)[rotatedArmPath(index).length - 1],
      radius: outerOrbRadius,
      tags: ["energy-source"],
      style: deepGraphite
    })),
    {
      id: "central-vortex-seed",
      type: "circle",
      center: [0.5, 0.5],
      radius: 0.071,
      tags: ["energy-source"],
      style: {
        ...deepGraphite,
        stroke: "rgba(61, 58, 63, 0.9)",
        fill: "rgba(39, 36, 40, 0.94)",
        glow: 0.004
      }
    },
    {
      id: "inner-still-point",
      type: "point",
      position: [0.5, 0.5],
      radius: 0.009,
      tags: ["energy-source"],
      style: {
        ...brightSeed,
        alpha: 0.42,
        glow: 0.006
      }
    },
    {
      id: "silent-boundary",
      type: "circle",
      center: [0.5, 0.5],
      radius: 0.405,
      style: {
        ...dimSilver,
        alpha: 0.12,
        glow: 0.001
      }
    }
  ],
  operators: [
    { id: "vortex-arms", type: "radialRepeat", source: "vortex-arm-prototype", center: [0.5, 0.5], count: 6, startAngle: 0 }
  ],
  modifiers: [
    { type: "rotate", target: "vortex-arms", speed: 1.15, direction: "ccw", origin: [0.5, 0.5] },
    { type: "breathe", target: "central-vortex-seed", amplitude: 0.035, frequency: 0.42, phase: 0.12 },
    ...Array.from({ length: 6 }, (_, index) => ({
      type: "followPath" as const,
      target: `outer-orb-${index + 1}`,
      path: [...rotatedArmPath(index)].reverse(),
      speed: 0.06,
      phase: index / 6,
      pingPong: true,
      rotateWith: vortexRotation
    })),
    { type: "travelingPulse", target: "vortex-arms", speed: 0.055, width: 0.22, intensity: 0.28, loop: true },
    { type: "dissolve", target: "silent-boundary", amount: 0.18 }
  ],
  relations: [
    { type: "repeats", from: "vortex-arms", to: "vortex-arm-prototype" },
    { type: "connects", from: "vortex-arm-prototype", to: "outer-orb-1" },
    { type: "orbits", from: "outer-orb-1", to: "central-vortex-seed" }
  ]
};
