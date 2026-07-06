import { evaluateScene } from "../geometry/evaluator/evaluateScene";
import type { EvaluatedGeometryNode, GeometryNode, GeometryScene, NodeTransform, Vec2 } from "../geometry/types";
import { createEditorElement, updateEditorElement, type EditorElement, type EditorGroup } from "./editorScene";

export interface ImportedEditorState {
  name: string;
  elements: readonly EditorElement[];
  groups: readonly EditorGroup[];
}

function rotatePoint(point: Vec2, origin: Vec2, rotationDegrees: number): Vec2 {
  const angle = (rotationDegrees * Math.PI) / 180;
  const x = point[0] - origin[0];
  const y = point[1] - origin[1];
  return [origin[0] + x * Math.cos(angle) - y * Math.sin(angle), origin[1] + x * Math.sin(angle) + y * Math.cos(angle)];
}

function transformPoint(point: Vec2, transform: NodeTransform): Vec2 {
  const scaled: Vec2 = [
    transform.origin[0] + (point[0] - transform.origin[0]) * transform.scale[0],
    transform.origin[1] + (point[1] - transform.origin[1]) * transform.scale[1]
  ];
  const rotated = rotatePoint(scaled, transform.rotationOrigin ?? transform.origin, transform.rotation);
  return [rotated[0] + transform.translate[0], rotated[1] + transform.translate[1]];
}

function nodeCenter(node: GeometryNode): Vec2 {
  if (node.type === "point") {
    return node.position;
  }
  if (node.type === "circle" || node.type === "arc" || node.type === "ellipse" || node.type === "polygon" || node.type === "spiral") {
    return node.center;
  }
  if (node.type === "line") {
    return [(node.from[0] + node.to[0]) / 2, (node.from[1] + node.to[1]) / 2];
  }
  return node.points[0] ?? [0.5, 0.5];
}

function elementFromEvaluatedNode(evaluatedNode: EvaluatedGeometryNode, index: number): EditorElement | null {
  const node = evaluatedNode.node;
  const center = transformPoint(nodeCenter(node), evaluatedNode.transform);
  const id = `imported-${node.type}-${index + 1}`;

  if (node.type === "circle" || node.type === "point") {
    const radius = node.type === "circle" ? node.radius : (node.radius ?? 0.012);
    return updateEditorElement(createEditorElement("circle", index), {
      id,
      center,
      size: radius,
      layer: index,
      filled: Boolean(node.style?.fill),
      stroke: node.style?.stroke ?? "rgba(213, 218, 216, 0.78)",
      fill: node.style?.fill ?? "rgba(213, 218, 216, 0.12)"
    });
  }
  if (node.type === "ellipse") {
    return updateEditorElement(createEditorElement("ellipse", index), {
      id,
      center,
      size: node.radiusX,
      rotation: node.rotation ?? 0,
      layer: index,
      filled: Boolean(node.style?.fill),
      stroke: node.style?.stroke ?? "rgba(213, 218, 216, 0.78)"
    });
  }
  if (node.type === "line") {
    const from = transformPoint(node.from, evaluatedNode.transform);
    const to = transformPoint(node.to, evaluatedNode.transform);
    return updateEditorElement(createEditorElement("line", index), {
      id,
      center: [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2],
      size: Math.hypot(to[0] - from[0], to[1] - from[1]) / 2,
      rotation: Math.atan2(to[1] - from[1], to[0] - from[0]),
      layer: index,
      stroke: node.style?.stroke ?? "rgba(213, 218, 216, 0.78)"
    });
  }
  if (node.type === "polygon" && node.sides === 3) {
    return updateEditorElement(createEditorElement("triangle", index), {
      id,
      center,
      size: node.radius,
      rotation: node.rotation ?? 0,
      layer: index,
      filled: Boolean(node.style?.fill),
      stroke: node.style?.stroke ?? "rgba(213, 218, 216, 0.78)"
    });
  }
  if (node.type === "arc") {
    return updateEditorElement(createEditorElement("quarterArc", index), {
      id,
      center,
      size: node.radius,
      rotation: node.startAngle,
      layer: index,
      stroke: node.style?.stroke ?? "rgba(213, 218, 216, 0.78)"
    });
  }
  if (node.type === "bezier") {
    return updateEditorElement(createEditorElement("bezier", index), {
      id,
      center,
      points: node.points.map((point) => transformPoint(point, evaluatedNode.transform)),
      layer: index,
      filled: Boolean(node.style?.fill),
      stroke: node.style?.stroke ?? "rgba(213, 218, 216, 0.78)"
    });
  }
  if (node.type === "spiral") {
    return updateEditorElement(createEditorElement("spiral", index), {
      id,
      center,
      size: Math.max(0.02, node.b * node.thetaEnd),
      rotation: node.rotation ?? 0,
      layer: index,
      stroke: node.style?.stroke ?? "rgba(213, 218, 216, 0.78)"
    });
  }
  return null;
}

export function createEditorStateFromScene(scene: GeometryScene): ImportedEditorState {
  const elements = evaluateScene(scene).nodes
    .map((node, index) => elementFromEvaluatedNode(node, index))
    .filter((element): element is EditorElement => element !== null);

  return {
    name: `${scene.name} Copy`,
    elements,
    groups: []
  };
}
