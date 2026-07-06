import type { Vec2 } from "../geometry/types";
import { createEditorElement, updateEditorElement, type EditorElement, type EditorGroup } from "./editorScene";

export type AlignmentAxis = "horizontal" | "vertical";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function centerOf(points: readonly Vec2[]): Vec2 {
  if (points.length === 0) {
    return [0.5, 0.5];
  }
  const sum = points.reduce<[number, number]>((acc, point) => [acc[0] + point[0], acc[1] + point[1]], [0, 0]);
  return [sum[0] / points.length, sum[1] / points.length];
}

function addVec2(a: Vec2, b: Vec2): Vec2 {
  return [a[0] + b[0], a[1] + b[1]];
}

export function selectElementAt(elements: readonly EditorElement[], point: Vec2): string | null {
  for (let index = elements.length - 1; index >= 0; index -= 1) {
    const element = elements[index];
    const hitRadius = Math.max(0.035, element.size * 0.65);
    if (distance(element.center, point) <= hitRadius) {
      return element.id;
    }
  }
  return null;
}

export function rotateElementToward(element: EditorElement, point: Vec2): EditorElement {
  return updateEditorElement(element, {
    rotation: Math.atan2(point[1] - element.center[1], point[0] - element.center[0])
  });
}

export function scaleElementToward(element: EditorElement, point: Vec2): EditorElement {
  return updateEditorElement(element, {
    size: clamp(distance(element.center, point), 0.01, 0.45)
  });
}

export function moveElementsByDelta(elements: readonly EditorElement[], selectedIds: readonly string[], delta: Vec2): EditorElement[] {
  const selected = new Set(selectedIds);
  return elements.map((element) => {
    if (!selected.has(element.id)) {
      return element;
    }
    return updateEditorElement(element, {
      center: addVec2(element.center, delta),
      points: element.points?.map((point) => addVec2(point, delta))
    });
  });
}

export function moveElementsFromDragStart(
  elements: readonly EditorElement[],
  selectedIds: readonly string[],
  startPoint: Vec2,
  currentPoint: Vec2
): EditorElement[] {
  return moveElementsByDelta(elements, selectedIds, [currentPoint[0] - startPoint[0], currentPoint[1] - startPoint[1]]);
}

export function assignOrbitTarget(elements: readonly EditorElement[], movingId: string, targetId: string): EditorElement[] {
  const moving = elements.find((element) => element.id === movingId);
  const target = elements.find((element) => element.id === targetId);
  if (!moving || !target || moving.id === target.id) {
    return [...elements];
  }

  return elements.map((element) =>
    element.id === movingId
      ? updateEditorElement(element, {
          motionType: "orbit",
          orbitTargetId: targetId,
          orbitRadius: distance(moving.center, target.center)
        })
      : element
  );
}

export function createPenBezierElement(points: readonly Vec2[], index: number): EditorElement {
  return updateEditorElement(createEditorElement("bezier", index), {
    center: centerOf(points),
    filled: false,
    points
  });
}

export function createEditorGroup(elements: readonly EditorElement[], selectedIds: readonly string[], index: number): EditorGroup {
  const selected = elements.filter((element) => selectedIds.includes(element.id));
  const center = centerOf(selected.map((element) => element.center));
  return {
    id: `editor-group-${index + 1}`,
    name: `Group ${index + 1}`,
    elementIds: selected.map((element) => element.id),
    center,
    motionType: "none",
    direction: "ccw",
    speed: 1,
    amplitude: 0.06,
    orbitRadius: 0.08,
    phase: 0
  };
}

export function moveGroupsForMovedElements(groups: readonly EditorGroup[], selectedIds: readonly string[], delta: Vec2): EditorGroup[] {
  const selected = new Set(selectedIds);
  return groups.map((group) =>
    group.elementIds.every((elementId) => selected.has(elementId))
      ? { ...group, center: addVec2(group.center, delta) }
      : group
  );
}

export function removeEditorElement(
  elements: readonly EditorElement[],
  groups: readonly EditorGroup[],
  elementId: string
): {
  elements: readonly EditorElement[];
  groups: readonly EditorGroup[];
  selectedIds: readonly string[];
  selectedId: string;
  selectedGroupId: string | null;
} {
  const nextElements = elements.filter((element) => element.id !== elementId);
  const nextGroups = groups
    .map((group) => ({ ...group, elementIds: group.elementIds.filter((id) => id !== elementId) }))
    .filter((group) => group.elementIds.length > 1);
  const selectedId = nextElements[0]?.id ?? "";
  return {
    elements: nextElements,
    groups: nextGroups,
    selectedIds: selectedId ? [selectedId] : [],
    selectedId,
    selectedGroupId: null
  };
}

export function moveLayerUp(elements: readonly EditorElement[], elementId: string): EditorElement[] {
  return elements.map((element) => (element.id === elementId ? updateEditorElement(element, { layer: (element.layer ?? 0) + 1 }) : element));
}

export function moveLayerDown(elements: readonly EditorElement[], elementId: string): EditorElement[] {
  return elements.map((element) => (element.id === elementId ? updateEditorElement(element, { layer: (element.layer ?? 0) - 1 }) : element));
}

export function moveLayerToTop(elements: readonly EditorElement[], elementId: string): EditorElement[] {
  const topLayer = Math.max(0, ...elements.map((element) => element.layer ?? 0));
  return elements.map((element) => (element.id === elementId ? updateEditorElement(element, { layer: topLayer + 1 }) : element));
}

export function moveLayerToBottom(elements: readonly EditorElement[], elementId: string): EditorElement[] {
  const bottomLayer = Math.min(0, ...elements.map((element) => element.layer ?? 0));
  return elements.map((element) => (element.id === elementId ? updateEditorElement(element, { layer: bottomLayer - 1 }) : element));
}

export function appendPenPoint(elements: readonly EditorElement[], selectedId: string | null, point: Vec2): {
  elements: readonly EditorElement[];
  selectedId: string;
} {
  const selected = elements.find((element) => element.id === selectedId);
  if (selected?.primitive === "bezier") {
    const points = [...(selected.points ?? []), point];
    return {
      elements: elements.map((element) =>
        element.id === selected.id ? updateEditorElement(element, { points, center: centerOf(points) }) : element
      ),
      selectedId: selected.id
    };
  }

  const element = createPenBezierElement([point], elements.length);
  return { elements: [...elements, element], selectedId: element.id };
}

export function mirrorSelectedAroundCenter(elements: readonly EditorElement[], selectedIds: readonly string[], center: Vec2): EditorElement[] {
  const selected = new Set(selectedIds);
  return elements.map((element) =>
    selected.has(element.id)
      ? updateEditorElement(element, {
          center: [2 * center[0] - element.center[0], 2 * center[1] - element.center[1]]
        })
      : element
  );
}

export function alignSelected(elements: readonly EditorElement[], selectedIds: readonly string[], axis: AlignmentAxis): EditorElement[] {
  const selected = elements.filter((element) => selectedIds.includes(element.id));
  if (selected.length < 2) {
    return [...elements];
  }
  const average = selected.reduce((sum, element) => sum + (axis === "horizontal" ? element.center[1] : element.center[0]), 0) / selected.length;
  const selectedSet = new Set(selectedIds);

  return elements.map((element) => {
    if (!selectedSet.has(element.id)) {
      return element;
    }
    return axis === "horizontal"
      ? updateEditorElement(element, { center: [element.center[0], average] })
      : updateEditorElement(element, { center: [average, element.center[1]] });
  });
}

export function distributeSelected(elements: readonly EditorElement[], selectedIds: readonly string[], axis: AlignmentAxis): EditorElement[] {
  const selected = elements
    .filter((element) => selectedIds.includes(element.id))
    .sort((a, b) => (axis === "horizontal" ? a.center[0] - b.center[0] : a.center[1] - b.center[1]));
  if (selected.length < 3) {
    return [...elements];
  }

  const first = selected[0];
  const last = selected[selected.length - 1];
  const start = axis === "horizontal" ? first.center[0] : first.center[1];
  const end = axis === "horizontal" ? last.center[0] : last.center[1];
  const positioned = new Map<string, Vec2>();

  selected.forEach((element, index) => {
    const value = start + ((end - start) * index) / (selected.length - 1);
    positioned.set(element.id, axis === "horizontal" ? [value, element.center[1]] : [element.center[0], value]);
  });

  return elements.map((element) => {
    const center = positioned.get(element.id);
    return center ? updateEditorElement(element, { center }) : element;
  });
}
