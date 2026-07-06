import type { ReactElement } from "react";
import {
  alignSelected,
  assignOrbitTarget,
  createEditorGroup,
  distributeSelected,
  mirrorSelectedAroundCenter,
  moveLayerDown,
  moveLayerToBottom,
  moveLayerToTop,
  moveLayerUp,
  removeEditorElement
} from "./editorOperations";
import {
  buildEditorScene,
  createEditorElement,
  type EditorDirection,
  type EditorElement,
  type EditorGroup,
  type EditorMotionType,
  type EditorPrimitive,
  updateEditorElement
} from "./editorScene";
import type { EditorCanvasTool } from "./EditorCanvasOverlay";

const primitives: EditorPrimitive[] = ["circle", "triangle", "ellipse", "spiral", "bezier", "line", "quarterArc"];
const motions: EditorMotionType[] = ["none", "breathe", "rotate", "counterRotate", "orbit", "spiralOrbit", "pulse"];
const directions: EditorDirection[] = ["ccw", "cw"];
const tools: EditorCanvasTool[] = ["select", "rotate", "scale", "pen"];

interface GeometryEditorProps {
  elements: readonly EditorElement[];
  groups: readonly EditorGroup[];
  selectedId: string;
  selectedIds: readonly string[];
  selectedGroupId: string | null;
  tool: EditorCanvasTool;
  onElementsChange: (elements: readonly EditorElement[]) => void;
  onGroupsChange: (groups: readonly EditorGroup[]) => void;
  onSelectedIdChange: (id: string) => void;
  onSelectedIdsChange: (ids: readonly string[]) => void;
  onSelectedGroupIdChange: (id: string | null) => void;
  onToolChange: (tool: EditorCanvasTool) => void;
  patternName: string;
  onPatternNameChange: (name: string) => void;
  isEditingSavedPattern: boolean;
  onSavePattern: () => void;
}

function formatName(value: string): string {
  return value.replace(/([A-Z])/g, " $1").toLowerCase();
}

export function GeometryEditor({
  elements,
  groups,
  selectedId,
  selectedIds,
  selectedGroupId,
  tool,
  onElementsChange,
  onGroupsChange,
  onSelectedIdChange,
  onSelectedIdsChange,
  onSelectedGroupIdChange,
  onToolChange,
  patternName,
  onPatternNameChange,
  isEditingSavedPattern,
  onSavePattern
}: GeometryEditorProps): ReactElement {
  const selectedElement = elements.find((element) => element.id === selectedId) ?? elements[0];
  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? null;

  const addPrimitive = (primitive: EditorPrimitive): void => {
    const nextElement = createEditorElement(primitive, elements.length);
    onElementsChange([...elements, nextElement]);
    onSelectedIdChange(nextElement.id);
    onSelectedIdsChange([nextElement.id]);
  };

  const updateSelected = (patch: Partial<EditorElement>): void => {
    if (!selectedElement) {
      return;
    }
    onElementsChange(elements.map((element) => (element.id === selectedElement.id ? updateEditorElement(element, patch) : element)));
  };

  const removeSelected = (): void => {
    if (!selectedElement) {
      return;
    }
    const next = removeEditorElement(elements, groups, selectedElement.id);
    onElementsChange(next.elements);
    onGroupsChange(next.groups);
    onSelectedIdChange(next.selectedId);
    onSelectedIdsChange(next.selectedIds);
    onSelectedGroupIdChange(next.selectedGroupId);
  };

  const selectElement = (id: string): void => {
    onSelectedIdChange(id);
    onSelectedIdsChange([id]);
    onSelectedGroupIdChange(null);
  };

  const selectGroup = (group: EditorGroup): void => {
    const firstId = group.elementIds[0];
    if (firstId) {
      onSelectedIdChange(firstId);
    }
    onSelectedIdsChange(group.elementIds);
    onSelectedGroupIdChange(group.id);
  };

  const updateOrbitTarget = (targetId: string): void => {
    if (!selectedElement || targetId === "") {
      updateSelected({ orbitTargetId: undefined });
      return;
    }
    const nextElements = assignOrbitTarget(elements, selectedElement.id, targetId);
    onElementsChange(nextElements);
  };

  const useMultiAction = (action: "mirror" | "alignH" | "alignV" | "distributeH" | "distributeV"): void => {
    if (selectedIds.length === 0) {
      return;
    }
    const nextElements =
      action === "mirror"
        ? mirrorSelectedAroundCenter(elements, selectedIds, [0.5, 0.5])
        : action === "alignH"
          ? alignSelected(elements, selectedIds, "horizontal")
          : action === "alignV"
            ? alignSelected(elements, selectedIds, "vertical")
            : action === "distributeH"
              ? distributeSelected(elements, selectedIds, "horizontal")
              : distributeSelected(elements, selectedIds, "vertical");
    onElementsChange(nextElements);
  };

  const useLayerAction = (action: "top" | "up" | "down" | "bottom"): void => {
    if (!selectedElement) {
      return;
    }
    const nextElements =
      action === "top"
        ? moveLayerToTop(elements, selectedElement.id)
        : action === "up"
          ? moveLayerUp(elements, selectedElement.id)
          : action === "down"
            ? moveLayerDown(elements, selectedElement.id)
            : moveLayerToBottom(elements, selectedElement.id);
    onElementsChange(nextElements);
  };

  const createGroup = (): void => {
    if (selectedIds.length < 2) {
      return;
    }
    const group = createEditorGroup(elements, selectedIds, groups.length);
    onGroupsChange([...groups, group]);
    onSelectedGroupIdChange(group.id);
  };

  const removeSelectedGroup = (): void => {
    if (!selectedGroup) {
      return;
    }
    onGroupsChange(groups.filter((group) => group.id !== selectedGroup.id));
    onSelectedGroupIdChange(null);
  };

  const updateSelectedGroup = (patch: Partial<EditorGroup>): void => {
    if (!selectedGroup) {
      return;
    }
    onGroupsChange(groups.map((group) => (group.id === selectedGroup.id ? { ...group, ...patch } : group)));
  };

  return (
    <section className="editor-panel" aria-label="Geometry editor">
      <div className="editor-section">
        <h2>Canvas Tool</h2>
        <div className="tool-grid">
          {tools.map((canvasTool) => (
            <button key={canvasTool} type="button" className={tool === canvasTool ? "active" : ""} onClick={() => onToolChange(canvasTool)}>
              {formatName(canvasTool)}
            </button>
          ))}
        </div>
      </div>

      <div className="editor-section">
        <h2>Pattern</h2>
        <label className="editor-field">
          Name
          <input value={patternName} onChange={(event) => onPatternNameChange(event.currentTarget.value)} />
        </label>
      </div>

      <div className="editor-section">
        <h2>Primitives</h2>
        <div className="primitive-grid">
          {primitives.map((primitive) => (
            <button key={primitive} type="button" aria-label={`Add ${formatName(primitive)}`} onClick={() => addPrimitive(primitive)}>
              {formatName(primitive)}
            </button>
          ))}
        </div>
      </div>

      <div className="editor-section">
        <h2>Elements</h2>
        <div className="element-list">
          {elements.map((element, index) => (
            <button
              key={element.id}
              type="button"
              aria-label={`Select ${formatName(element.primitive)} ${String(index + 1).padStart(2, "0")} ${element.id}`}
              className={selectedIds.includes(element.id) ? "element-button active" : "element-button"}
              onClick={() => selectElement(element.id)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{formatName(element.primitive)} {String(index + 1).padStart(2, "0")}</strong>
              <small>{element.id}</small>
            </button>
          ))}
        </div>
      </div>

      {groups.length > 0 ? (
        <div className="editor-section">
          <h2>Groups</h2>
          <div className="element-list">
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                className={group.id === selectedGroup?.id ? "element-button active" : "element-button"}
                onClick={() => selectGroup(group)}
              >
                <span>{String(group.elementIds.length).padStart(2, "0")}</span>
                <strong>{group.name}</strong>
                <small>{group.motionType} · {group.id}</small>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {selectedElement ? (
        <div className="editor-section">
          <h2>Geometry</h2>
          <label className="checkbox-row">
            <input type="checkbox" checked={selectedElement.visible} onChange={(event) => updateSelected({ visible: event.currentTarget.checked })} />
            Visible
          </label>
          <label className="checkbox-row">
            <input type="checkbox" checked={selectedElement.filled} onChange={(event) => updateSelected({ filled: event.currentTarget.checked })} />
            Fill shape
          </label>
          <small className="editor-meta">Layer {selectedElement.layer ?? 0}</small>
          <div className="editor-grid">
            <label>
              X
              <input
                type="range"
                min="0.05"
                max="0.95"
                step="0.01"
                value={selectedElement.center[0]}
                onChange={(event) => updateSelected({ center: [Number(event.currentTarget.value), selectedElement.center[1]] })}
              />
            </label>
            <label>
              Y
              <input
                type="range"
                min="0.05"
                max="0.95"
                step="0.01"
                value={selectedElement.center[1]}
                onChange={(event) => updateSelected({ center: [selectedElement.center[0], Number(event.currentTarget.value)] })}
              />
            </label>
            <label>
              Size
              <input
                type="range"
                min="0.01"
                max="0.45"
                step="0.005"
                value={selectedElement.size}
                onChange={(event) => updateSelected({ size: Number(event.currentTarget.value) })}
              />
            </label>
            <label>
              Rotate
              <input
                type="range"
                min="-3.14"
                max="3.14"
                step="0.01"
                value={selectedElement.rotation}
                onChange={(event) => updateSelected({ rotation: Number(event.currentTarget.value) })}
              />
            </label>
            <label>
              Path Target
              <select value={selectedElement.orbitTargetId ?? ""} onChange={(event) => updateOrbitTarget(event.currentTarget.value)}>
                <option value="">circular self orbit</option>
                {elements
                  .filter((element) => element.id !== selectedElement.id)
                  .map((element, index) => (
                    <option key={element.id} value={element.id}>
                      {formatName(element.primitive)} {String(index + 1).padStart(2, "0")}
                    </option>
                  ))}
              </select>
            </label>
          </div>
        </div>
      ) : null}

      <div className="editor-section">
        <h2>Arrange · {selectedIds.length} selected</h2>
        <div className="tool-grid">
          <button type="button" onClick={() => useMultiAction("mirror")} disabled={selectedIds.length < 1}>
            Mirror
          </button>
          <button type="button" onClick={() => useMultiAction("alignH")} disabled={selectedIds.length < 2}>
            Align H
          </button>
          <button type="button" onClick={() => useMultiAction("alignV")} disabled={selectedIds.length < 2}>
            Align V
          </button>
          <button type="button" onClick={() => useMultiAction("distributeH")} disabled={selectedIds.length < 3}>
            Space H
          </button>
          <button type="button" onClick={() => useMultiAction("distributeV")} disabled={selectedIds.length < 3}>
            Space V
          </button>
          <button type="button" onClick={createGroup} disabled={selectedIds.length < 2}>
            Group
          </button>
          <button type="button" onClick={removeSelectedGroup} disabled={!selectedGroup}>
            Ungroup
          </button>
          <button type="button" onClick={() => useLayerAction("top")} disabled={!selectedElement}>
            Top
          </button>
          <button type="button" onClick={() => useLayerAction("up")} disabled={!selectedElement}>
            Up
          </button>
          <button type="button" onClick={() => useLayerAction("down")} disabled={!selectedElement}>
            Down
          </button>
          <button type="button" onClick={() => useLayerAction("bottom")} disabled={!selectedElement}>
            Bottom
          </button>
        </div>
      </div>

      {selectedGroup ? (
        <div className="editor-section">
          <h2>Group Motion</h2>
          <div className="editor-grid">
            <label>
              Type
              <select
                value={selectedGroup.motionType}
                onChange={(event) => updateSelectedGroup({ motionType: event.currentTarget.value as EditorMotionType })}
              >
                {motions.map((motion) => (
                  <option key={motion} value={motion}>
                    {formatName(motion)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Direction
              <select value={selectedGroup.direction} onChange={(event) => updateSelectedGroup({ direction: event.currentTarget.value as EditorDirection })}>
                {directions.map((direction) => (
                  <option key={direction} value={direction}>
                    {direction}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Speed
              <input
                type="range"
                min="0"
                max="8"
                step="0.05"
                value={selectedGroup.speed}
                onChange={(event) => updateSelectedGroup({ speed: Number(event.currentTarget.value) })}
              />
            </label>
            <label>
              Amount
              <input
                type="range"
                min="0"
                max="0.25"
                step="0.005"
                value={selectedGroup.amplitude}
                onChange={(event) => updateSelectedGroup({ amplitude: Number(event.currentTarget.value) })}
              />
            </label>
          </div>
        </div>
      ) : null}

      {selectedElement ? (
        <div className="editor-section">
          <h2>Motion</h2>
          <div className="editor-grid">
            <label>
              Type
              <select
                value={selectedElement.motionType}
                onChange={(event) => updateSelected({ motionType: event.currentTarget.value as EditorMotionType })}
              >
                {motions.map((motion) => (
                  <option key={motion} value={motion}>
                    {formatName(motion)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Direction
              <select value={selectedElement.direction} onChange={(event) => updateSelected({ direction: event.currentTarget.value as EditorDirection })}>
                {directions.map((direction) => (
                  <option key={direction} value={direction}>
                    {direction}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Speed
              <input
                type="range"
                min="0"
                max="8"
                step="0.05"
                value={selectedElement.speed}
                onChange={(event) => updateSelected({ speed: Number(event.currentTarget.value) })}
              />
            </label>
            <label>
              Radius
              <input
                type="range"
                min="0.005"
                max="0.24"
                step="0.005"
                value={selectedElement.orbitRadius}
                onChange={(event) => updateSelected({ orbitRadius: Number(event.currentTarget.value) })}
              />
            </label>
            <label>
              Amount
              <input
                type="range"
                min="0"
                max="0.25"
                step="0.005"
                value={selectedElement.amplitude}
                onChange={(event) => updateSelected({ amplitude: Number(event.currentTarget.value) })}
              />
            </label>
            <label>
              Phase
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={selectedElement.phase}
                onChange={(event) => updateSelected({ phase: Number(event.currentTarget.value) })}
              />
            </label>
          </div>
        </div>
      ) : null}

      <div className="editor-actions">
        <button type="button" onClick={onSavePattern}>
          {isEditingSavedPattern ? "Update Pattern" : "Save Pattern"}
        </button>
        <button type="button" onClick={removeSelected} disabled={!selectedElement}>
          Delete
        </button>
        <small>{buildEditorScene(elements, groups).nodes.length} nodes · {groups.length} groups · {buildEditorScene(elements, groups).modifiers?.length ?? 0} motions</small>
      </div>
    </section>
  );
}
