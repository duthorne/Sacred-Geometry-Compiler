import type { GeometryScene, GeometryStyle } from "../geometry/types";
import { brightSeed, dimSilver } from "./styles";

const deepGraphite: GeometryStyle = {
  stroke: "rgba(50, 48, 52, 0.84)",
  fill: "rgba(38, 36, 40, 0.88)",
  lineWidth: 0.0015,
  alpha: 0.9,
  glow: 0.002
};

const eyeFill: GeometryStyle = {
  stroke: "rgba(58, 56, 60, 0.72)",
  fill: "rgba(34, 32, 36, 0.74)",
  lineWidth: 0.0014,
  alpha: 0.86,
  glow: 0.002
};

const apertureLine: GeometryStyle = {
  stroke: "rgba(74, 72, 77, 0.68)",
  lineWidth: 0.004,
  alpha: 0.7,
  glow: 0.002
};

export const triuneAperture: GeometryScene = {
  id: "triune-aperture",
  name: "Triune Aperture",
  canvas: { coordinateSystem: "normalized", background: "#050606" },
  symmetry: { type: "Cn", order: 3, center: [0.5, 0.5] },
  nodes: [
    {
      id: "eye-ellipse-prototype",
      type: "ellipse",
      role: "prototype",
      center: [0.5, 0.31],
      radiusX: 0.095,
      radiusY: 0.175,
      rotation: Math.PI / 2,
      style: eyeFill
    },
    { id: "axis-stem-prototype", type: "line", role: "prototype", from: [0.5, 0.19], to: [0.5, 0.43], style: apertureLine },
    {
      id: "inner-ring-prototype",
      type: "circle",
      role: "prototype",
      center: [0.5, 0.31],
      radius: 0.103,
      style: { ...dimSilver, stroke: "rgba(62, 60, 65, 0.62)", lineWidth: 0.0026, alpha: 0.7 }
    },
    {
      id: "outer-orb-prototype",
      type: "circle",
      role: "prototype",
      center: [0.5, 0.105],
      radius: 0.064,
      tags: ["energy-source"],
      style: deepGraphite
    },
    {
      id: "inner-orb-prototype",
      type: "circle",
      role: "prototype",
      center: [0.5, 0.315],
      radius: 0.058,
      tags: ["energy-source"],
      style: deepGraphite
    },
    {
      id: "small-orb-left-prototype",
      type: "circle",
      role: "prototype",
      center: [0.392, 0.315],
      radius: 0.018,
      tags: ["energy-source"],
      style: deepGraphite
    },
    {
      id: "small-orb-right-prototype",
      type: "circle",
      role: "prototype",
      center: [0.608, 0.315],
      radius: 0.018,
      tags: ["energy-source"],
      style: deepGraphite
    },
    {
      id: "small-orb-top-prototype",
      type: "circle",
      role: "prototype",
      center: [0.5, 0.223],
      radius: 0.018,
      tags: ["energy-source"],
      style: deepGraphite
    },
    {
      id: "small-orb-bottom-prototype",
      type: "circle",
      role: "prototype",
      center: [0.5, 0.407],
      radius: 0.018,
      tags: ["energy-source"],
      style: deepGraphite
    },
    {
      id: "triune-center",
      type: "circle",
      center: [0.5, 0.5],
      radius: 0.071,
      tags: ["energy-source"],
      style: {
        ...deepGraphite,
        stroke: "rgba(63, 60, 66, 0.92)",
        fill: "rgba(40, 38, 43, 0.94)",
        glow: 0.004
      }
    },
    {
      id: "triune-still-point",
      type: "point",
      position: [0.5, 0.5],
      radius: 0.008,
      tags: ["energy-source"],
      style: { ...brightSeed, alpha: 0.32, glow: 0.006 }
    }
  ],
  operators: [
    { id: "triune-eye-ellipses", type: "radialRepeat", source: "eye-ellipse-prototype", center: [0.5, 0.5], count: 3, startAngle: 0 },
    { id: "triune-axis-stems", type: "radialRepeat", source: "axis-stem-prototype", center: [0.5, 0.5], count: 3, startAngle: 0 },
    { id: "triune-inner-rings", type: "radialRepeat", source: "inner-ring-prototype", center: [0.5, 0.5], count: 3, startAngle: 0 },
    { id: "triune-outer-orbs", type: "radialRepeat", source: "outer-orb-prototype", center: [0.5, 0.5], count: 3, startAngle: 0 },
    { id: "triune-inner-orbs", type: "radialRepeat", source: "inner-orb-prototype", center: [0.5, 0.5], count: 3, startAngle: 0 },
    { id: "triune-small-left", type: "radialRepeat", source: "small-orb-left-prototype", center: [0.5, 0.5], count: 3, startAngle: 0 },
    { id: "triune-small-right", type: "radialRepeat", source: "small-orb-right-prototype", center: [0.5, 0.5], count: 3, startAngle: 0 },
    { id: "triune-small-top", type: "radialRepeat", source: "small-orb-top-prototype", center: [0.5, 0.5], count: 3, startAngle: 0 },
    { id: "triune-small-bottom", type: "radialRepeat", source: "small-orb-bottom-prototype", center: [0.5, 0.5], count: 3, startAngle: 0 }
  ],
  modifiers: [
    { type: "rotate", target: "triune-eye-ellipses", speed: 0.42, direction: "ccw", origin: [0.5, 0.5] },
    { type: "rotate", target: "triune-axis-stems", speed: 0.42, direction: "ccw", origin: [0.5, 0.5] },
    { type: "rotate", target: "triune-inner-rings", speed: 0.42, direction: "ccw", origin: [0.5, 0.5] },
    { type: "rotate", target: "triune-outer-orbs", speed: 0.42, direction: "ccw", origin: [0.5, 0.5] },
    { type: "rotate", target: "triune-inner-orbs", speed: 0.42, direction: "ccw", origin: [0.5, 0.5] },
    { type: "rotate", target: "triune-small-left", speed: 0.42, direction: "ccw", origin: [0.5, 0.5] },
    { type: "rotate", target: "triune-small-right", speed: 0.42, direction: "ccw", origin: [0.5, 0.5] },
    { type: "rotate", target: "triune-small-top", speed: 0.42, direction: "ccw", origin: [0.5, 0.5] },
    { type: "rotate", target: "triune-small-bottom", speed: 0.42, direction: "ccw", origin: [0.5, 0.5] },
    { type: "areaPulse", target: "outer-orb-prototype", minArea: 0.55, maxArea: 1, frequency: 0.12, phase: 0.05 },
    { type: "areaPulse", target: "inner-orb-prototype", minArea: 0.1, maxArea: 1, frequency: 0.1, phase: 0.22 },
    { type: "areaPulse", target: "small-orb-left-prototype", minArea: 0.1, maxArea: 1, frequency: 0.08, phase: 0 },
    { type: "areaPulse", target: "small-orb-right-prototype", minArea: 0.1, maxArea: 1, frequency: 0.08, phase: 0.25 },
    { type: "areaPulse", target: "small-orb-top-prototype", minArea: 0.1, maxArea: 1, frequency: 0.08, phase: 0.5 },
    { type: "areaPulse", target: "small-orb-bottom-prototype", minArea: 0.1, maxArea: 1, frequency: 0.08, phase: 0.75 },
    { type: "fillPulse", target: "small-orb-left-prototype", fill: "rgba(38, 36, 40, 1)", frequency: 0.08, phase: 0 },
    { type: "fillPulse", target: "small-orb-right-prototype", fill: "rgba(38, 36, 40, 1)", frequency: 0.08, phase: 0.25 },
    { type: "fillPulse", target: "small-orb-top-prototype", fill: "rgba(38, 36, 40, 1)", frequency: 0.08, phase: 0.5 },
    { type: "fillPulse", target: "small-orb-bottom-prototype", fill: "rgba(38, 36, 40, 1)", frequency: 0.08, phase: 0.75 },
    { type: "breathe", target: "triune-center", amplitude: 0.035, frequency: 0.34, phase: 0.15 },
    { type: "orbit", target: "triune-still-point", center: [0.5, 0.5], radius: 0.0025, speed: 0.75, phase: 0.5 },
    { type: "travelingPulse", target: "triune-eye-ellipses", speed: 0.04, width: 0.2, intensity: 0.22, loop: true }
  ],
  relations: [
    { type: "repeats", from: "triune-eye-ellipses", to: "eye-ellipse-prototype" },
    { type: "orbits", from: "outer-orb-prototype", to: "triune-center" },
    { type: "nested_in", from: "inner-orb-prototype", to: "inner-ring-prototype" },
    { type: "connects", from: "axis-stem-prototype", to: "triune-center" }
  ]
};
