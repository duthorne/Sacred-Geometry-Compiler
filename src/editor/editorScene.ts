import type { DynamicModifier, GeometryNode, GeometryOperator, GeometryRelation, GeometryScene, Vec2 } from "../geometry/types";
import { polygonPoints, sampleSpiral } from "../geometry/primitives/pathBuilders";
import { TAU } from "../utils/math";

export type EditorPrimitive = "circle" | "triangle" | "ellipse" | "spiral" | "bezier" | "line" | "quarterArc";
export type EditorMotionType = "none" | "breathe" | "rotate" | "counterRotate" | "orbit" | "spiralOrbit" | "pulse";
export type EditorDirection = "cw" | "ccw";

export interface EditorElement {
  id: string;
  primitive: EditorPrimitive;
  center: Vec2;
  size: number;
  rotation: number;
  layer: number;
  visible: boolean;
  filled: boolean;
  stroke: string;
  fill: string;
  motionType: EditorMotionType;
  direction: EditorDirection;
  speed: number;
  amplitude: number;
  orbitRadius: number;
  orbitTargetId?: string;
  phase: number;
  points?: readonly Vec2[];
}

export interface EditorGroup {
  id: string;
  name: string;
  elementIds: readonly string[];
  center: Vec2;
  motionType: EditorMotionType;
  direction: EditorDirection;
  speed: number;
  amplitude: number;
  orbitRadius: number;
  phase: number;
}

const primitiveDefaults: Record<EditorPrimitive, Pick<EditorElement, "center" | "size" | "rotation">> = {
  circle: { center: [0.5, 0.5], size: 0.13, rotation: 0 },
  triangle: { center: [0.5, 0.5], size: 0.18, rotation: -Math.PI / 2 },
  ellipse: { center: [0.5, 0.5], size: 0.16, rotation: 0 },
  spiral: { center: [0.5, 0.5], size: 0.2, rotation: 0 },
  bezier: { center: [0.5, 0.5], size: 0.18, rotation: 0 },
  line: { center: [0.5, 0.5], size: 0.22, rotation: 0 },
  quarterArc: { center: [0.5, 0.5], size: 0.16, rotation: 0 }
};

export function createEditorElement(primitive: EditorPrimitive, index: number): EditorElement {
  const defaults = primitiveDefaults[primitive];
  const offset = ((index % 5) - 2) * 0.045;
  return {
    id: `editor-${primitive}-${index + 1}`,
    primitive,
    center: [defaults.center[0] + offset, defaults.center[1] + offset * 0.35],
    size: defaults.size,
    rotation: defaults.rotation,
    layer: index,
    visible: true,
    filled: false,
    stroke: "rgba(213, 218, 216, 0.78)",
    fill: "rgba(213, 218, 216, 0.12)",
    motionType: "none",
    direction: "ccw",
    speed: 1,
    amplitude: 0.06,
    orbitRadius: 0.035,
    phase: (index % 8) / 8
  };
}

export function updateEditorElement(element: EditorElement, patch: Partial<EditorElement>): EditorElement {
  return { ...element, ...patch };
}

function styleForElement(element: EditorElement): GeometryNode["style"] {
  if (!element.visible) {
    return {
      stroke: "rgba(0, 0, 0, 0)",
      fill: undefined,
      lineWidth: 0.001,
      alpha: 0,
      glow: 0
    };
  }

  return {
    stroke: element.stroke,
    fill: element.filled ? element.fill : undefined,
    lineWidth: 0.0018,
    alpha: 0.9,
    glow: 0.007
  };
}

function bezierPoints(center: Vec2, size: number): readonly Vec2[] {
  return [
    [center[0] - size * 0.55, center[1] + size * 0.2],
    [center[0] - size * 0.18, center[1] - size * 0.62],
    [center[0] + size * 0.42, center[1] - size * 0.56],
    [center[0] + size * 0.55, center[1] + size * 0.15],
    [center[0] + size * 0.24, center[1] + size * 0.54],
    [center[0] - size * 0.26, center[1] + size * 0.48],
    [center[0] - size * 0.55, center[1] + size * 0.2]
  ];
}

function elementToNode(element: EditorElement): GeometryNode {
  const style = styleForElement(element);

  if (element.primitive === "circle") {
    return { id: element.id, type: "circle", center: element.center, radius: element.size, tags: element.visible ? ["energy-source"] : undefined, style };
  }
  if (element.primitive === "triangle") {
    return { id: element.id, type: "polygon", center: element.center, radius: element.size, sides: 3, rotation: element.rotation, style };
  }
  if (element.primitive === "ellipse") {
    return {
      id: element.id,
      type: "ellipse",
      center: element.center,
      radiusX: element.size,
      radiusY: element.size * 0.58,
      rotation: element.rotation,
      style
    };
  }
  if (element.primitive === "spiral") {
    return {
      id: element.id,
      type: "spiral",
      model: "archimedean",
      center: element.center,
      a: element.size * 0.04,
      b: element.size * 0.017,
      thetaStart: 0,
      thetaEnd: Math.PI * 7,
      rotation: element.rotation,
      direction: element.direction,
      samples: 180,
      tags: element.visible ? ["energy-source"] : undefined,
      style
    };
  }
  if (element.primitive === "bezier") {
    return { id: element.id, type: "bezier", points: element.points ?? bezierPoints(element.center, element.size), closed: element.filled, style };
  }
  if (element.primitive === "quarterArc") {
    return {
      id: element.id,
      type: "arc",
      center: element.center,
      radius: element.size,
      startAngle: element.rotation,
      endAngle: element.rotation + Math.PI / 2,
      style
    };
  }

  const dx = Math.cos(element.rotation) * element.size;
  const dy = Math.sin(element.rotation) * element.size;
  return {
    id: element.id,
    type: "line",
    from: [element.center[0] - dx, element.center[1] - dy],
    to: [element.center[0] + dx, element.center[1] + dy],
    style
  };
}

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function pointOnEllipse(center: Vec2, radiusX: number, radiusY: number, rotation: number, angle: number): Vec2 {
  const x = Math.cos(angle) * radiusX;
  const y = Math.sin(angle) * radiusY;
  return [
    center[0] + x * Math.cos(rotation) - y * Math.sin(rotation),
    center[1] + x * Math.sin(rotation) + y * Math.cos(rotation)
  ];
}

function cubicBezierPoint(points: readonly Vec2[], t: number): Vec2 {
  const [p0, p1, p2, p3] = points;
  const inv = 1 - t;
  return [
    inv ** 3 * p0[0] + 3 * inv ** 2 * t * p1[0] + 3 * inv * t ** 2 * p2[0] + t ** 3 * p3[0],
    inv ** 3 * p0[1] + 3 * inv ** 2 * t * p1[1] + 3 * inv * t ** 2 * p2[1] + t ** 3 * p3[1]
  ];
}

function sampleBezierPath(points: readonly Vec2[], samples = 48): Vec2[] {
  if (points.length < 4) {
    return [...points];
  }
  const path: Vec2[] = [];
  for (let index = 1; index + 2 < points.length; index += 3) {
    const segment = [points[index - 1], points[index], points[index + 1], points[index + 2]];
    for (let sample = 0; sample <= samples; sample += 1) {
      if (path.length > 0 && sample === 0) {
        continue;
      }
      path.push(cubicBezierPoint(segment, sample / samples));
    }
  }
  return path;
}

function sampleElementPath(element: EditorElement): readonly Vec2[] {
  if (element.primitive === "circle") {
    return Array.from({ length: 65 }, (_, index) => {
      const angle = (index / 64) * TAU;
      return [element.center[0] + Math.cos(angle) * element.size, element.center[1] + Math.sin(angle) * element.size] as Vec2;
    });
  }
  if (element.primitive === "ellipse") {
    return Array.from({ length: 65 }, (_, index) => pointOnEllipse(element.center, element.size, element.size * 0.58, element.rotation, (index / 64) * TAU));
  }
  if (element.primitive === "triangle") {
    const points = polygonPoints({ center: element.center, radius: element.size, sides: 3, rotation: element.rotation });
    return [...points, points[0]];
  }
  if (element.primitive === "line") {
    const dx = Math.cos(element.rotation) * element.size;
    const dy = Math.sin(element.rotation) * element.size;
    return [
      [element.center[0] - dx, element.center[1] - dy],
      [element.center[0] + dx, element.center[1] + dy]
    ];
  }
  if (element.primitive === "quarterArc") {
    return Array.from({ length: 33 }, (_, index) => {
      const angle = element.rotation + (index / 32) * (Math.PI / 2);
      return [element.center[0] + Math.cos(angle) * element.size, element.center[1] + Math.sin(angle) * element.size] as Vec2;
    });
  }
  if (element.primitive === "spiral") {
    return sampleSpiral({
      id: `${element.id}-path`,
      type: "spiral",
      model: "archimedean",
      center: element.center,
      a: element.size * 0.04,
      b: element.size * 0.017,
      thetaStart: 0,
      thetaEnd: Math.PI * 7,
      rotation: element.rotation,
      direction: element.direction,
      samples: 180
    });
  }
  return sampleBezierPath(element.points ?? bezierPoints(element.center, element.size));
}

function elementToModifier(element: EditorElement, elements: readonly EditorElement[]): DynamicModifier | null {
  if (element.motionType === "none") {
    return null;
  }
  if (element.motionType === "breathe") {
    return { type: "breathe", target: element.id, amplitude: element.amplitude, frequency: element.speed, phase: element.phase };
  }
  if (element.motionType === "rotate") {
    return { type: "rotate", target: element.id, speed: element.speed, direction: element.direction, origin: element.center };
  }
  if (element.motionType === "counterRotate") {
    return { type: "counterRotate", target: element.id, speed: element.speed, origin: element.center };
  }
  if (element.motionType === "orbit") {
    const target = elements.find((candidate) => candidate.id === element.orbitTargetId);
    if (target) {
      return {
        type: "followPath",
        target: element.id,
        path: sampleElementPath(target),
        speed: element.speed,
        phase: element.phase,
        pingPong: true
      };
    }
    return {
      type: "orbit",
      target: element.id,
      center: element.center,
      radius: element.orbitRadius,
      speed: element.speed,
      phase: element.phase
    };
  }
  if (element.motionType === "spiralOrbit") {
    return {
      type: "spiralOrbit",
      target: element.id,
      center: element.center,
      minRadius: Math.max(0.005, element.orbitRadius * 0.35),
      maxRadius: Math.max(0.02, element.orbitRadius * 2.2),
      angularSpeed: element.direction === "cw" ? -element.speed : element.speed,
      radialFrequency: Math.max(0.1, element.speed * 0.35),
      phase: element.phase
    };
  }

  return { type: "travelingPulse", target: element.id, speed: element.speed * 0.12, width: 0.2, intensity: element.amplitude * 8, loop: true };
}

function groupToModifiers(group: EditorGroup, elements: readonly EditorElement[]): DynamicModifier[] {
  if (group.motionType === "none") {
    return [];
  }

  return group.elementIds
    .map((elementId) => elements.find((element) => element.id === elementId))
    .filter((element): element is EditorElement => element !== undefined)
    .map((element): DynamicModifier => {
      if (group.motionType === "breathe") {
        return { type: "breathe", target: element.id, amplitude: group.amplitude, frequency: group.speed, phase: group.phase };
      }
      if (group.motionType === "rotate") {
        return { type: "rotate", target: element.id, speed: group.speed, direction: group.direction, origin: group.center };
      }
      if (group.motionType === "counterRotate") {
        return { type: "counterRotate", target: element.id, speed: group.speed, origin: group.center };
      }
      if (group.motionType === "orbit") {
        return { type: "orbit", target: element.id, center: group.center, radius: distance(element.center, group.center), speed: group.speed, phase: group.phase };
      }
      if (group.motionType === "spiralOrbit") {
        return {
          type: "spiralOrbit",
          target: element.id,
          center: group.center,
          minRadius: Math.max(0.005, group.orbitRadius * 0.35),
          maxRadius: Math.max(0.02, group.orbitRadius * 2.2),
          angularSpeed: group.direction === "cw" ? -group.speed : group.speed,
          radialFrequency: Math.max(0.1, group.speed * 0.35),
          phase: group.phase
        };
      }
      return { type: "travelingPulse", target: element.id, speed: group.speed * 0.12, width: 0.2, intensity: group.amplitude * 8, loop: true };
    });
}

export function buildEditorScene(elements: readonly EditorElement[], groups: readonly EditorGroup[] = []): GeometryScene {
  const sortedElements = [...elements].sort((a, b) => (a.layer ?? 0) - (b.layer ?? 0));
  const nodes = sortedElements.map(elementToNode);
  const modifiers = [
    ...sortedElements.map((element) => elementToModifier(element, sortedElements)).filter((modifier): modifier is DynamicModifier => modifier !== null),
    ...groups.flatMap((group) => groupToModifiers(group, elements))
  ];
  const operators: GeometryOperator[] = groups.map((group) => ({ id: group.id, type: "group", children: group.elementIds }));
  const relations: GeometryRelation[] = sortedElements.slice(1).map((element) => ({
    type: "attached_to",
    from: element.id,
    to: elements[0].id
  }));

  return {
    id: "geometry-editor",
    name: "Geometry Editor",
    canvas: { coordinateSystem: "normalized", background: "#050606" },
    symmetry: { type: "none" },
    nodes,
    operators,
    modifiers,
    relations
  };
}

export const starterEditorElements: readonly EditorElement[] = [
  updateEditorElement(createEditorElement("circle", 0), { size: 0.28, filled: false, motionType: "breathe", speed: 0.5 }),
  updateEditorElement(createEditorElement("spiral", 1), { center: [0.5, 0.5], size: 0.22, motionType: "rotate", speed: 3.2 }),
  updateEditorElement(createEditorElement("circle", 2), {
    center: [0.62, 0.5],
    size: 0.035,
    filled: true,
    motionType: "orbit",
    orbitRadius: 0.12,
    speed: 0.6
  }),
  updateEditorElement(createEditorElement("triangle", 3), { center: [0.5, 0.5], size: 0.16, motionType: "counterRotate", speed: 1.2 })
];
