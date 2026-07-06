import { type PointerEvent, type ReactElement, useRef, useState } from "react";
import type { Vec2 } from "../geometry/types";
import {
  appendPenPoint,
  moveElementsFromDragStart,
  moveGroupsForMovedElements,
  rotateElementToward,
  scaleElementToward,
  selectElementAt
} from "./editorOperations";
import type { EditorElement, EditorGroup, EditorMotionType } from "./editorScene";

export type EditorCanvasTool = "select" | "rotate" | "scale" | "pen";

interface EditorCanvasOverlayProps {
  elements: readonly EditorElement[];
  groups: readonly EditorGroup[];
  selectedIds: readonly string[];
  selectedId: string;
  tool: EditorCanvasTool;
  onElementsChange: (elements: readonly EditorElement[]) => void;
  onGroupsChange: (groups: readonly EditorGroup[]) => void;
  onSelectedIdChange: (id: string) => void;
  onSelectedIdsChange: (ids: readonly string[]) => void;
  onCreateGroupFromSelection: () => void;
  onApplyMotionToSelection: (motionType: Exclude<EditorMotionType, "none">) => void;
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function eventToPoint(event: PointerEvent<HTMLDivElement>): Vec2 {
  const rect = event.currentTarget.getBoundingClientRect();
  const scale = Math.min(rect.width, rect.height);
  const offsetX = (rect.width - scale) / 2;
  const offsetY = (rect.height - scale) / 2;
  return [
    clamp((event.clientX - rect.left - offsetX) / scale),
    clamp((event.clientY - rect.top - offsetY) / scale)
  ];
}

function toggleSelection(selectedIds: readonly string[], id: string): readonly string[] {
  return selectedIds.includes(id) ? selectedIds.filter((selectedId) => selectedId !== id) : [...selectedIds, id];
}

export function EditorCanvasOverlay({
  elements,
  groups,
  selectedIds,
  selectedId,
  tool,
  onElementsChange,
  onGroupsChange,
  onSelectedIdChange,
  onSelectedIdsChange,
  onCreateGroupFromSelection,
  onApplyMotionToSelection
}: EditorCanvasOverlayProps): ReactElement {
  const [draggingIds, setDraggingIds] = useState<readonly string[]>([]);
  const dragStartPointRef = useRef<Vec2 | null>(null);
  const dragStartElementsRef = useRef<readonly EditorElement[]>([]);
  const dragStartGroupsRef = useRef<readonly EditorGroup[]>([]);

  const selectIds = (ids: readonly string[]): void => {
    onSelectedIdsChange(ids);
    if (ids[0]) {
      onSelectedIdChange(ids[0]);
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    const point = eventToPoint(event);
    event.currentTarget.setPointerCapture(event.pointerId);

    if (tool === "pen") {
      const next = appendPenPoint(elements, selectedId, point);
      onElementsChange(next.elements);
      selectIds([next.selectedId]);
      return;
    }

    const hitId = selectElementAt(elements, point);
    if (tool === "select") {
      if (!hitId) {
        selectIds([]);
        return;
      }
      const nextIds = event.shiftKey || event.metaKey ? toggleSelection(selectedIds, hitId) : selectedIds.includes(hitId) ? selectedIds : [hitId];
      selectIds(nextIds);
      setDraggingIds(nextIds);
      dragStartPointRef.current = point;
      dragStartElementsRef.current = elements;
      dragStartGroupsRef.current = groups;
      return;
    }

    const activeIds = hitId && !selectedIds.includes(hitId) ? [hitId] : selectedIds;
    if (activeIds.length === 0) {
      return;
    }
    selectIds(activeIds);
    setDraggingIds(activeIds);
    dragStartPointRef.current = point;
    dragStartElementsRef.current = elements;
    dragStartGroupsRef.current = groups;
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (draggingIds.length === 0) {
      return;
    }
    const point = eventToPoint(event);
    if (tool === "select") {
      const startPoint = dragStartPointRef.current;
      if (!startPoint) {
        dragStartPointRef.current = point;
        return;
      }
      const delta: Vec2 = [point[0] - startPoint[0], point[1] - startPoint[1]];
      onElementsChange(moveElementsFromDragStart(dragStartElementsRef.current, draggingIds, startPoint, point));
      onGroupsChange(moveGroupsForMovedElements(dragStartGroupsRef.current, draggingIds, delta));
      return;
    }

    const active = new Set(draggingIds);
    onElementsChange(
      elements.map((element) => {
        if (!active.has(element.id)) {
          return element;
        }
        return tool === "rotate" ? rotateElementToward(element, point) : scaleElementToward(element, point);
      })
    );
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>): void => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDraggingIds([]);
    dragStartPointRef.current = null;
    dragStartElementsRef.current = [];
    dragStartGroupsRef.current = [];
  };

  return (
    <div
      className={`editor-canvas-overlay tool-${tool}`}
      aria-label="Direct geometry editor"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {selectedIds.length > 0 ? (
        <div className="canvas-action-bar" onPointerDown={(event) => event.stopPropagation()}>
          <button type="button" onClick={onCreateGroupFromSelection} disabled={selectedIds.length < 2}>
            Group
          </button>
          <button type="button" onClick={() => onApplyMotionToSelection("breathe")}>
            Breathe
          </button>
          <button type="button" onClick={() => onApplyMotionToSelection("rotate")}>
            Rotate
          </button>
          <button type="button" onClick={() => onApplyMotionToSelection("orbit")}>
            Orbit
          </button>
          <button type="button" onClick={() => onApplyMotionToSelection("spiralOrbit")}>
            Spiral
          </button>
        </div>
      ) : null}
      {elements.filter((element) => selectedIds.includes(element.id)).map((element) => (
        <span
          key={element.id}
          className={[
            "editor-handle",
            selectedIds.includes(element.id) ? "selected" : "",
            element.visible ? "" : "invisible-guide"
          ].join(" ")}
          style={{
            left: `${element.center[0] * 100}%`,
            top: `${element.center[1] * 100}%`
          }}
        />
      ))}
    </div>
  );
}
