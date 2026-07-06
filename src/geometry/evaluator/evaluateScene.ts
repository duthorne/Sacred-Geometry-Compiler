import type {
  EvaluatedGeometryNode,
  EvaluatedGeometryScene,
  GeometryNode,
  GeometryOperator,
  GeometryScene,
  ModulationState,
  NodeTransform,
  Vec2
} from "../types";
import { applyDynamicModifiers, applyOperatorModifiers } from "../../modulation/modifiers";

const identityTransform: NodeTransform = {
  origin: [0.5, 0.5],
  rotation: 0,
  scale: [1, 1],
  translate: [0, 0]
};

function makeInstance(id: string, sourceId: string, node: GeometryNode, transform: NodeTransform): EvaluatedGeometryNode {
  return { id, sourceId, node, transform };
}

function combineTransforms(parent: NodeTransform, child: NodeTransform): NodeTransform {
  return {
    origin: child.origin,
    rotation: parent.rotation + child.rotation,
    scale: [parent.scale[0] * child.scale[0], parent.scale[1] * child.scale[1]],
    translate: [parent.translate[0] + child.translate[0], parent.translate[1] + child.translate[1]]
  };
}

function findOperator(operators: readonly GeometryOperator[], id: string): GeometryOperator | undefined {
  return operators.find((operator) => operator.id === id);
}

function expandReference(
  id: string,
  nodeMap: ReadonlyMap<string, GeometryNode>,
  operators: readonly GeometryOperator[],
  transform: NodeTransform,
  prefix: string
): EvaluatedGeometryNode[] {
  const node = nodeMap.get(id);
  if (node) {
    return [makeInstance(`${prefix}${node.id}`, node.id, node, transform)];
  }

  const operator = findOperator(operators, id);
  if (!operator) {
    return [];
  }

  if (operator.type === "group") {
    return operator.children.flatMap((childId) => expandReference(childId, nodeMap, operators, transform, `${prefix}${operator.id}:`));
  }

  return [];
}

function expandRadialRepeat(
  operator: Extract<GeometryOperator, { type: "radialRepeat" }>,
  nodeMap: ReadonlyMap<string, GeometryNode>,
  operators: readonly GeometryOperator[]
): EvaluatedGeometryNode[] {
  const angleStep = operator.angleStep ?? 360 / operator.count;
  const startAngle = operator.startAngle ?? 0;

  return Array.from({ length: operator.count }, (_, index) => {
    const transform: NodeTransform = {
      origin: operator.center,
      rotation: startAngle + angleStep * index,
      scale: [1, 1],
      translate: [0, 0]
    };
    return expandReference(operator.source, nodeMap, operators, transform, `${operator.id}:${index}:`);
  }).flat();
}

function mirrorScale(axis: "horizontal" | "vertical"): Vec2 {
  return axis === "vertical" ? [-1, 1] : [1, -1];
}

function expandMirror(
  operator: Extract<GeometryOperator, { type: "mirror" }>,
  nodeMap: ReadonlyMap<string, GeometryNode>,
  operators: readonly GeometryOperator[]
): EvaluatedGeometryNode[] {
  const transform: NodeTransform = {
    origin: operator.origin,
    rotation: 0,
    scale: mirrorScale(operator.axis),
    translate: [0, 0]
  };
  return expandReference(operator.source, nodeMap, operators, transform, `${operator.id}:`);
}

export function evaluateScene(scene: GeometryScene, modulation?: ModulationState): EvaluatedGeometryScene {
  const nodeMap = new Map(scene.nodes.map((node) => [node.id, node]));
  const modifiers = scene.modifiers ?? [];
  const operators = modulation
    ? (scene.operators ?? []).map((operator) => applyOperatorModifiers(operator, modifiers, modulation))
    : (scene.operators ?? []);
  const operatorSourceIds = new Set(
    operators.flatMap((operator) => {
      if (operator.type === "group") {
        return operator.children;
      }
      return [operator.source];
    })
  );

  const directNodes = scene.nodes
    .filter((node) => node.role !== "prototype" || !operatorSourceIds.has(node.id))
    .map((node) => makeInstance(node.id, node.id, node, identityTransform));

  const operatorNodes = operators.flatMap((operator) => {
    if (operator.type === "radialRepeat") {
      return expandRadialRepeat(operator, nodeMap, operators);
    }
    if (operator.type === "mirror") {
      return expandMirror(operator, nodeMap, operators);
    }
    return [];
  });

  const nodes = [...directNodes, ...operatorNodes].map((node) => ({
    ...node,
    transform: combineTransforms(identityTransform, node.transform)
  }));

  return {
    id: scene.id,
    name: scene.name,
    background: scene.canvas.background,
    nodes: modulation ? applyDynamicModifiers(nodes, modifiers, modulation) : nodes,
    relations: scene.relations ?? []
  };
}
