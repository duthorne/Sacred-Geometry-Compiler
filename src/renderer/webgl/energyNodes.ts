import type { EvaluatedGeometryNode, EvaluatedGeometryScene, GeometryNode, NodeTransform, Vec2 } from "../../geometry/types";
import type { EnergyNode } from "./types";
import { degreesToRadians } from "../../utils/math";

function basePosition(node: GeometryNode): Vec2 | null {
  if (node.type === "point") {
    return node.position;
  }
  if (node.type === "circle" || node.type === "arc" || node.type === "ellipse" || node.type === "polygon" || node.type === "spiral") {
    return node.center;
  }
  if (node.type === "line") {
    return [(node.from[0] + node.to[0]) / 2, (node.from[1] + node.to[1]) / 2];
  }
  if (node.type === "polyline" || node.type === "bezier") {
    return node.points[0] ?? null;
  }
  return null;
}

function transformPoint(point: Vec2, transform: NodeTransform): Vec2 {
  const translated: Vec2 = [point[0] + transform.translate[0], point[1] + transform.translate[1]];
  const relative: Vec2 = [translated[0] - transform.origin[0], translated[1] - transform.origin[1]];
  const scaled: Vec2 = [relative[0] * transform.scale[0], relative[1] * transform.scale[1]];
  const rotationOrigin = transform.rotationOrigin ?? transform.origin;
  const rotationRelative: Vec2 = [
    transform.origin[0] + scaled[0] - rotationOrigin[0],
    transform.origin[1] + scaled[1] - rotationOrigin[1]
  ];
  const angle = degreesToRadians(transform.rotation);
  const rotated: Vec2 = [
    rotationRelative[0] * Math.cos(angle) - rotationRelative[1] * Math.sin(angle),
    rotationRelative[0] * Math.sin(angle) + rotationRelative[1] * Math.cos(angle)
  ];
  return [rotationOrigin[0] + rotated[0], rotationOrigin[1] + rotated[1]];
}

function isEnergySource(node: EvaluatedGeometryNode): boolean {
  return node.node.tags?.includes("energy-source") ?? false;
}

export function collectEnergyNodes(scene: EvaluatedGeometryScene): EnergyNode[] {
  return scene.nodes
    .filter(isEnergySource)
    .map((node, index) => {
      const position = basePosition(node.node);
      if (!position) {
        return null;
      }
      const [x, y] = transformPoint(position, node.transform);
      return {
        x,
        y,
        amplitude: 0.42 + index * 0.035,
        frequency: 9 + index * 1.7,
        phase: (index / 8) % 1
      };
    })
    .filter((node): node is EnergyNode => node !== null)
    .slice(0, 8);
}
