import type { Vec2 } from "../geometry/types";

export const TAU = Math.PI * 2;

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function pointOnCircle(center: Vec2, radius: number, angleRadians: number): Vec2 {
  return [center[0] + Math.cos(angleRadians) * radius, center[1] + Math.sin(angleRadians) * radius];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
