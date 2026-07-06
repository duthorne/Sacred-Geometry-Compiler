import type {
  DynamicModifier,
  EvaluatedGeometryNode,
  GeometryOperator,
  ModulationState,
  NodeTransform,
  Vec2
} from "../geometry/types";
import { clamp, lerp, TAU } from "../utils/math";

function matchesTarget(node: EvaluatedGeometryNode, target: string): boolean {
  return node.sourceId === target || node.id === target || node.id.startsWith(`${target}:`);
}

function isDensityWaveForTarget(
  modifier: DynamicModifier,
  target: string
): modifier is Extract<DynamicModifier, { type: "densityWave" }> {
  return modifier.type === "densityWave" && modifier.target === target;
}

function scaleTransform(transform: NodeTransform, scale: number): NodeTransform {
  return {
    ...transform,
    scale: [transform.scale[0] * scale, transform.scale[1] * scale]
  };
}

function scaleTransformAt(transform: NodeTransform, scale: number, origin: Vec2): NodeTransform {
  return {
    ...transform,
    origin,
    rotationOrigin: transform.rotationOrigin ?? (transform.rotation === 0 ? undefined : transform.origin),
    scale: [transform.scale[0] * scale, transform.scale[1] * scale]
  };
}

function translateTransform(transform: NodeTransform, translate: Vec2): NodeTransform {
  return {
    ...transform,
    translate: [transform.translate[0] + translate[0], transform.translate[1] + translate[1]]
  };
}

function nodeAnchor(node: EvaluatedGeometryNode): Vec2 {
  const geometry = node.node;
  if (geometry.type === "point") {
    return geometry.position;
  }
  if (geometry.type === "circle" || geometry.type === "arc" || geometry.type === "ellipse" || geometry.type === "polygon" || geometry.type === "spiral") {
    return geometry.center;
  }
  if (geometry.type === "line") {
    return [(geometry.from[0] + geometry.to[0]) / 2, (geometry.from[1] + geometry.to[1]) / 2];
  }
  return geometry.points[0] ?? [0.5, 0.5];
}

function pointOnPath(path: readonly Vec2[], progress: number): Vec2 {
  if (path.length === 0) {
    return [0.5, 0.5];
  }
  if (path.length === 1) {
    return path[0];
  }

  const segmentLengths = path.slice(1).map((point, index) => Math.hypot(point[0] - path[index][0], point[1] - path[index][1]));
  const totalLength = segmentLengths.reduce((sum, length) => sum + length, 0);
  if (totalLength === 0) {
    return path[0];
  }

  let remaining = clamp(progress, 0, 1) * totalLength;
  for (let index = 0; index < segmentLengths.length; index += 1) {
    const length = segmentLengths[index];
    if (remaining <= length) {
      const t = length === 0 ? 0 : remaining / length;
      return [lerp(path[index][0], path[index + 1][0], t), lerp(path[index][1], path[index + 1][1], t)];
    }
    remaining -= length;
  }
  return path[path.length - 1];
}

function pathProgress(time: number, speed: number, phase: number, pingPong: boolean): number {
  const raw = time * speed + phase;
  if (!pingPong) {
    return raw - Math.floor(raw);
  }
  const cycle = raw % 2;
  const normalizedCycle = cycle < 0 ? cycle + 2 : cycle;
  return normalizedCycle <= 1 ? normalizedCycle : 2 - normalizedCycle;
}

function rotatePoint(point: Vec2, center: Vec2, degrees: number): Vec2 {
  const angle = (degrees * Math.PI) / 180;
  const x = point[0] - center[0];
  const y = point[1] - center[1];
  return [
    center[0] + x * Math.cos(angle) - y * Math.sin(angle),
    center[1] + x * Math.sin(angle) + y * Math.cos(angle)
  ];
}

function rgbaWithAlpha(color: string, alpha: number): string {
  const match = color.match(/rgba?\(([^)]+)\)/);
  if (!match) {
    return color;
  }
  const [r, g, b] = match[1].split(",").map((part) => part.trim());
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
}

function applyModifier(node: EvaluatedGeometryNode, modifier: DynamicModifier, modulation: ModulationState): EvaluatedGeometryNode {
  if (!matchesTarget(node, modifier.target)) {
    return node;
  }

  if (modifier.type === "breathe") {
    const phase = modifier.phase ?? 0;
    const scale = 1 + modifier.amplitude * modulation.breath * Math.sin(modulation.time * modifier.frequency + phase);
    return { ...node, transform: scaleTransform(node.transform, scale) };
  }

  if (modifier.type === "rotate") {
    const sign = modifier.direction === "cw" ? -1 : 1;
    return {
      ...node,
      transform: {
        ...node.transform,
        rotationOrigin: modifier.origin ?? node.transform.rotationOrigin,
        rotation: node.transform.rotation + sign * modulation.time * modifier.speed
      }
    };
  }

  if (modifier.type === "counterRotate") {
    return {
      ...node,
      transform: {
        ...node.transform,
        rotationOrigin: modifier.origin ?? node.transform.rotationOrigin,
        rotation: node.transform.rotation - modulation.time * modifier.speed
      }
    };
  }

  if (modifier.type === "orbit") {
    const phase = modifier.phase ?? 0;
    const angle = modulation.time * modifier.speed + phase * TAU;
    const radius = modifier.radius * lerp(0.45, 1.25, modulation.energy);
    return { ...node, transform: translateTransform(node.transform, [Math.cos(angle) * radius, Math.sin(angle) * radius]) };
  }

  if (modifier.type === "followPath") {
    const progress = pathProgress(modulation.time, modifier.speed, modifier.phase ?? 0, modifier.pingPong);
    const pathPoint = pointOnPath(modifier.path, progress);
    const desired = modifier.rotateWith
      ? rotatePoint(
          pathPoint,
          modifier.rotateWith.center,
          modulation.time * modifier.rotateWith.speed * (modifier.rotateWith.direction === "cw" ? -1 : 1)
        )
      : pathPoint;
    const anchor = nodeAnchor(node);
    return { ...node, transform: translateTransform(node.transform, [desired[0] - anchor[0], desired[1] - anchor[1]]) };
  }

  if (modifier.type === "spiralOrbit") {
    const phase = modifier.phase ?? 0;
    const cycle = 0.5 + 0.5 * Math.sin(modulation.time * modifier.radialFrequency + phase * TAU);
    const radius = lerp(modifier.maxRadius, modifier.minRadius, cycle);
    const angle = modulation.time * modifier.angularSpeed + phase * TAU;
    const desired: Vec2 = [
      modifier.center[0] + Math.cos(angle) * radius,
      modifier.center[1] + Math.sin(angle) * radius
    ];
    const anchor = nodeAnchor(node);
    return { ...node, transform: translateTransform(node.transform, [desired[0] - anchor[0], desired[1] - anchor[1]]) };
  }

  if (modifier.type === "phaseShift") {
    const source = modifier.source === "time" ? modulation.time % 1 : modifier.source === "energy" ? modulation.energy : modulation.phase;
    return { ...node, transform: { ...node.transform, rotation: node.transform.rotation + source * modifier.amount * 360 } };
  }

  if (modifier.type === "travelingPulse") {
    const pulse = modifier.loop ? (modulation.time * modifier.speed) % 1 : clamp(modulation.time * modifier.speed, 0, 1);
    const distance = Math.abs(pulse - modulation.phase);
    const strength = clamp(1 - distance / modifier.width, 0, 1) * modifier.intensity;
    return { ...node, transform: scaleTransform(node.transform, 1 + strength * 0.08) };
  }

  if (modifier.type === "fillPulse") {
    const phase = modifier.phase ?? 0;
    const fillAmount = 0.5 + 0.5 * Math.sin(modulation.time * modifier.frequency * TAU + phase * TAU);
    return { ...node, node: { ...node.node, style: { ...node.node.style, fill: rgbaWithAlpha(modifier.fill, fillAmount) } } };
  }

  if (modifier.type === "areaPulse") {
    const phase = modifier.phase ?? 0;
    const wave = 0.5 + 0.5 * Math.sin(modulation.time * modifier.frequency * TAU + phase * TAU);
    const area = lerp(modifier.minArea, modifier.maxArea, wave);
    const scale = Math.sqrt(Math.max(0, area));
    return { ...node, transform: scaleTransformAt(node.transform, scale, nodeAnchor(node)) };
  }

  if (modifier.type === "compress" || modifier.type === "expand") {
    const sign = modifier.type === "compress" ? -1 : 1;
    const center = modifier.center ?? [0.5, 0.5];
    const amount = modifier.amount * modulation.tension * sign;
    return {
      ...node,
      transform: translateTransform(node.transform, [
        (node.transform.origin[0] - center[0]) * amount,
        (node.transform.origin[1] - center[1]) * amount
      ])
    };
  }

  if (modifier.type === "dissolve") {
    const alpha = clamp(1 - modifier.amount * modulation.phase, 0.12, 1);
    return { ...node, node: { ...node.node, style: { ...node.node.style, alpha } } };
  }

  if (modifier.type === "densityWave") {
    return node;
  }

  const exhaustive: never = modifier;
  return exhaustive;
}

export function applyDynamicModifiers(
  nodes: readonly EvaluatedGeometryNode[],
  modifiers: readonly DynamicModifier[],
  modulation: ModulationState
): EvaluatedGeometryNode[] {
  return modifiers.reduce(
    (currentNodes, modifier) => currentNodes.map((node) => applyModifier(node, modifier, modulation)),
    [...nodes]
  );
}

export function applyOperatorModifiers(
  operator: GeometryOperator,
  modifiers: readonly DynamicModifier[],
  modulation: ModulationState
): GeometryOperator {
  const densityModifier = modifiers.find((modifier) => isDensityWaveForTarget(modifier, operator.id));
  if (!densityModifier || operator.type !== "radialRepeat") {
    return operator;
  }

  const wave = 0.5 + 0.5 * Math.sin(modulation.time * densityModifier.frequency);
  const count = Math.round(lerp(densityModifier.minDensity, densityModifier.maxDensity, wave * modulation.density + (1 - modulation.density) * wave));
  return {
    ...operator,
    count: Math.max(1, count)
  };
}
