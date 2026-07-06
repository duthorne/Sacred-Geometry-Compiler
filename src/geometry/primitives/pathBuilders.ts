import type { PolygonNode, SpiralNode, Vec2 } from "../types";
import { pointOnCircle, TAU } from "../../utils/math";

export function polygonPoints(node: Pick<PolygonNode, "center" | "radius" | "sides" | "rotation">): Vec2[] {
  const rotation = node.rotation ?? 0;
  return Array.from({ length: node.sides }, (_, index) => {
    const angle = rotation + (TAU * index) / node.sides;
    return pointOnCircle(node.center, node.radius, angle);
  });
}

export function sampleSpiral(node: SpiralNode): Vec2[] {
  const sampleCount = Math.max(2, node.samples ?? 160);
  const direction = node.direction === "cw" ? -1 : 1;
  const rotation = node.rotation ?? 0;
  const points: Vec2[] = [];

  for (let index = 0; index < sampleCount; index += 1) {
    const t = index / (sampleCount - 1);
    const theta = node.thetaStart + (node.thetaEnd - node.thetaStart) * t;
    const radius =
      node.model === "archimedean" ? node.a + node.b * theta : node.a * Math.exp(node.b * theta);
    const signedTheta = rotation + theta * direction;
    points.push([node.center[0] + Math.cos(signedTheta) * radius, node.center[1] + Math.sin(signedTheta) * radius]);
  }

  return points;
}
