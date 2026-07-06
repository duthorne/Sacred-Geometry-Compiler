import { type ReactElement, useEffect, useMemo, useRef, useState } from "react";
import { CanvasLayer } from "../renderer/canvas/CanvasLayer";
import { EnergyLayer } from "../renderer/webgl/EnergyLayer";
import { findPattern, patterns } from "../patterns";
import { clampPlaybackSpeed, createDefaultModulationState, evaluateAutoTimeline, mergeModulationState } from "../modulation/engine";
import type { ModulationState } from "../geometry/types";
import { GeometryEditor } from "../editor/GeometryEditor";
import { EditorCanvasOverlay, type EditorCanvasTool } from "../editor/EditorCanvasOverlay";
import { buildEditorScene, starterEditorElements, updateEditorElement, type EditorElement, type EditorGroup, type EditorMotionType } from "../editor/editorScene";
import { createEditorGroup } from "../editor/editorOperations";
import { createEditorStateFromScene } from "../editor/importScene";
import {
  deleteSavedPattern,
  loadSavedPatterns,
  persistSavedPatterns,
  saveEditorSceneAsPattern,
  updateSavedPattern,
  type SavedPattern
} from "../editor/savedPatterns";
import "./styles.css";

const modulationControls: Array<keyof Omit<ModulationState, "time">> = [
  "energy",
  "density",
  "phase",
  "breath",
  "tension",
  "coherence"
];

export function App(): ReactElement {
  const [workspaceMode, setWorkspaceMode] = useState<"patterns" | "editor">("patterns");
  const [patternId, setPatternId] = useState(patterns[0].id);
  const [savedPatterns, setSavedPatterns] = useState<readonly SavedPattern[]>(() =>
    typeof window === "undefined" ? [] : loadSavedPatterns(window.localStorage)
  );
  const [paused, setPaused] = useState(true);
  const [time, setTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(0.45);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [overrides, setOverrides] = useState<Partial<ModulationState>>({});
  const [editorElements, setEditorElements] = useState<readonly EditorElement[]>(starterEditorElements);
  const [editorGroups, setEditorGroups] = useState<readonly EditorGroup[]>([]);
  const [editorPatternName, setEditorPatternName] = useState("Custom Pattern");
  const [editingSavedPatternId, setEditingSavedPatternId] = useState<string | null>(null);
  const [selectedEditorId, setSelectedEditorId] = useState(starterEditorElements[0].id);
  const [selectedEditorIds, setSelectedEditorIds] = useState<readonly string[]>([starterEditorElements[0].id]);
  const [selectedEditorGroupId, setSelectedEditorGroupId] = useState<string | null>(null);
  const [editorTool, setEditorTool] = useState<EditorCanvasTool>("select");
  const startedAtRef = useRef<number | null>(null);
  const lastFrameAtRef = useRef<number | null>(null);
  const playbackSpeedRef = useRef(playbackSpeed);
  const allPatterns = useMemo(() => [...patterns, ...savedPatterns.map((pattern) => pattern.scene)], [savedPatterns]);
  const patternScene = useMemo(() => allPatterns.find((pattern) => pattern.id === patternId) ?? findPattern(patternId), [allPatterns, patternId]);
  const editorScene = useMemo(() => buildEditorScene(editorElements, editorGroups), [editorElements, editorGroups]);
  const scene = workspaceMode === "editor" ? editorScene : patternScene;
  const selectedSavedPattern = savedPatterns.find((pattern) => pattern.id === patternId);
  const selectedDefaultPattern = patterns.find((pattern) => pattern.id === patternId);
  const baseModulation = paused ? createDefaultModulationState(time) : evaluateAutoTimeline(time, reducedMotion);
  const modulation = mergeModulationState(baseModulation, overrides);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReducedMotion = (): void => setReducedMotion(query.matches);
    updateReducedMotion();
    query.addEventListener("change", updateReducedMotion);
    return () => query.removeEventListener("change", updateReducedMotion);
  }, []);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    if (paused) {
      startedAtRef.current = null;
      lastFrameAtRef.current = null;
      return undefined;
    }

    let animationFrame = 0;
    const tick = (timestamp: number): void => {
      startedAtRef.current ??= timestamp;
      const lastFrameAt = lastFrameAtRef.current ?? timestamp;
      const deltaSeconds = Math.max(0, (timestamp - lastFrameAt) / 1000);
      lastFrameAtRef.current = timestamp;
      setTime((currentTime) => currentTime + deltaSeconds * playbackSpeedRef.current);
      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [paused]);

  const requestFullscreen = (): void => {
    const root = document.documentElement;
    if (!document.fullscreenElement) {
      void root.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  };

  const reset = (): void => {
    setPatternId(patterns[0].id);
    setTime(0);
    setOverrides({});
    startedAtRef.current = null;
    lastFrameAtRef.current = null;
  };

  const updateOverride = (key: keyof Omit<ModulationState, "time">, value: number): void => {
    setOverrides((current) => ({ ...current, [key]: value }));
  };

  const updateSelectedEditorIds = (ids: readonly string[]): void => {
    setSelectedEditorIds(ids);
    const idSet = new Set(ids);
    const matchingGroup = editorGroups.find((group) => group.elementIds.length === ids.length && group.elementIds.every((id) => idSet.has(id)));
    setSelectedEditorGroupId(matchingGroup?.id ?? null);
    if (ids[0]) {
      setSelectedEditorId(ids[0]);
    }
  };

  const createGroupFromSelection = (): void => {
    if (selectedEditorIds.length < 2) {
      return;
    }
    const group = createEditorGroup(editorElements, selectedEditorIds, editorGroups.length);
    setEditorGroups((currentGroups) => [...currentGroups, group]);
    setSelectedEditorGroupId(group.id);
  };

  const applyMotionToSelection = (motionType: Exclude<EditorMotionType, "none">): void => {
    if (selectedEditorIds.length > 1) {
      const group =
        editorGroups.find((candidate) => candidate.id === selectedEditorGroupId) ??
        createEditorGroup(editorElements, selectedEditorIds, editorGroups.length);
      const nextGroup = { ...group, motionType };
      setEditorGroups((currentGroups) =>
        currentGroups.some((candidate) => candidate.id === nextGroup.id)
          ? currentGroups.map((candidate) => (candidate.id === nextGroup.id ? nextGroup : candidate))
          : [...currentGroups, nextGroup]
      );
      setSelectedEditorGroupId(nextGroup.id);
      return;
    }

    const selectedId = selectedEditorIds[0];
    setEditorElements((currentElements) =>
      currentElements.map((element) => (element.id === selectedId ? updateEditorElement(element, { motionType }) : element))
    );
  };

  const saveCurrentEditorPattern = (): void => {
    const editorState = { elements: editorElements, groups: editorGroups };
    const nextSavedPatterns = editingSavedPatternId
      ? updateSavedPattern(savedPatterns, editingSavedPatternId, editorScene, { name: editorPatternName, editorState })
      : saveEditorSceneAsPattern(savedPatterns, editorScene, { name: editorPatternName, editorState });
    const latestPattern = editingSavedPatternId
      ? nextSavedPatterns.find((pattern) => pattern.id === editingSavedPatternId)
      : nextSavedPatterns[nextSavedPatterns.length - 1];
    if (!latestPattern) {
      return;
    }
    setSavedPatterns(nextSavedPatterns);
    persistSavedPatterns(window.localStorage, nextSavedPatterns);
    setPatternId(latestPattern.id);
    setEditingSavedPatternId(latestPattern.id);
    setWorkspaceMode("patterns");
  };

  const editSavedPattern = (savedPattern: SavedPattern): void => {
    if (!savedPattern.editorState) {
      return;
    }
    setEditorElements(savedPattern.editorState.elements);
    setEditorGroups(savedPattern.editorState.groups);
    setEditorPatternName(savedPattern.scene.name);
    setEditingSavedPatternId(savedPattern.id);
    const firstElementId = savedPattern.editorState.elements[0]?.id ?? "";
    setSelectedEditorId(firstElementId);
    setSelectedEditorIds(firstElementId ? [firstElementId] : []);
    setSelectedEditorGroupId(null);
    setWorkspaceMode("editor");
  };

  const editDefaultPattern = (): void => {
    if (!selectedDefaultPattern) {
      return;
    }
    const state = createEditorStateFromScene(selectedDefaultPattern);
    setEditorElements(state.elements);
    setEditorGroups(state.groups);
    setEditorPatternName(state.name);
    setEditingSavedPatternId(null);
    const firstElementId = state.elements[0]?.id ?? "";
    setSelectedEditorId(firstElementId);
    setSelectedEditorIds(firstElementId ? [firstElementId] : []);
    setSelectedEditorGroupId(null);
    setWorkspaceMode("editor");
  };

  const deleteCurrentSavedPattern = (): void => {
    if (!selectedSavedPattern) {
      return;
    }
    const nextSavedPatterns = deleteSavedPattern(savedPatterns, selectedSavedPattern.id);
    setSavedPatterns(nextSavedPatterns);
    persistSavedPatterns(window.localStorage, nextSavedPatterns);
    if (editingSavedPatternId === selectedSavedPattern.id) {
      setEditingSavedPatternId(null);
    }
    setPatternId(patterns[0].id);
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Sacred Geometry Lab</p>
          <h1>Dynamic Sacred Geometry</h1>
        </div>

        <div className="mode-tabs" aria-label="Workspace mode">
          <button type="button" className={workspaceMode === "patterns" ? "active" : ""} onClick={() => setWorkspaceMode("patterns")}>
            Patterns
          </button>
          <button type="button" className={workspaceMode === "editor" ? "active" : ""} onClick={() => setWorkspaceMode("editor")}>
            Editor
          </button>
        </div>

        <section className="panel">
          {workspaceMode === "patterns" ? (
            <>
              <h2>Patterns</h2>
              <div className="pattern-list">
                {patterns.map((pattern, index) => (
                  <button
                    key={pattern.id}
                    type="button"
                    className={pattern.id === patternId ? "pattern-button active" : "pattern-button"}
                    onClick={() => setPatternId(pattern.id)}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {pattern.name}
                  </button>
                ))}
              </div>
              <button type="button" className="delete-pattern-button" disabled={!selectedDefaultPattern} onClick={editDefaultPattern}>
                Edit Pattern
              </button>
              {savedPatterns.length > 0 ? (
                <>
                  <h2>Saved</h2>
                  <div className="pattern-list">
                    {savedPatterns.map((savedPattern, index) => (
                      <button
                        key={savedPattern.id}
                        type="button"
                        className={savedPattern.id === patternId ? "pattern-button active" : "pattern-button"}
                        onClick={() => setPatternId(savedPattern.id)}
                      >
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        {savedPattern.scene.name}
                      </button>
                    ))}
                  </div>
                  <button type="button" className="delete-pattern-button" disabled={!selectedSavedPattern} onClick={deleteCurrentSavedPattern}>
                    Delete Pattern
                  </button>
                  <button
                    type="button"
                    className="delete-pattern-button"
                    disabled={!selectedSavedPattern?.editorState}
                    onClick={() => selectedSavedPattern ? editSavedPattern(selectedSavedPattern) : undefined}
                  >
                    Edit Pattern
                  </button>
                </>
              ) : null}
            </>
          ) : (
            <GeometryEditor
              elements={editorElements}
              groups={editorGroups}
              selectedId={selectedEditorId}
              selectedIds={selectedEditorIds}
              selectedGroupId={selectedEditorGroupId}
              tool={editorTool}
              onElementsChange={setEditorElements}
              onGroupsChange={setEditorGroups}
              onSelectedIdChange={setSelectedEditorId}
              onSelectedIdsChange={updateSelectedEditorIds}
              onSelectedGroupIdChange={setSelectedEditorGroupId}
              onToolChange={setEditorTool}
              patternName={editorPatternName}
              onPatternNameChange={setEditorPatternName}
              isEditingSavedPattern={editingSavedPatternId !== null}
              onSavePattern={saveCurrentEditorPattern}
            />
          )}
        </section>
      </aside>

      <section className="stage" aria-label="Geometry stage">
        <EnergyLayer scene={scene} modulation={modulation} />
        <CanvasLayer scene={scene} modulation={modulation} />
        {workspaceMode === "editor" ? (
          <EditorCanvasOverlay
            elements={editorElements}
            groups={editorGroups}
            selectedIds={selectedEditorIds}
            selectedId={selectedEditorId}
            tool={editorTool}
            onElementsChange={setEditorElements}
            onGroupsChange={setEditorGroups}
            onSelectedIdChange={setSelectedEditorId}
            onSelectedIdsChange={updateSelectedEditorIds}
            onCreateGroupFromSelection={createGroupFromSelection}
            onApplyMotionToSelection={applyMotionToSelection}
          />
        ) : null}
        <div className="stage-label">
          <span>{scene.name}</span>
          <small>{Math.round(time)}s · {scene.nodes.length} source nodes</small>
        </div>
      </section>

      <footer className="controls">
        <div className="parameter-strip" aria-label="Modulation controls">
          <label>
            <span>speed</span>
            <input
              type="range"
              min="0.1"
              max="1.2"
              step="0.01"
              value={playbackSpeed}
              onChange={(event) => setPlaybackSpeed(clampPlaybackSpeed(Number(event.currentTarget.value)))}
            />
          </label>
          {modulationControls.map((key) => (
            <label key={key}>
              <span>{key}</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={modulation[key]}
                onChange={(event) => updateOverride(key, Number(event.currentTarget.value))}
              />
            </label>
          ))}
        </div>
        <button type="button" onClick={() => setPaused((value) => !value)}>
          {paused ? "Play" : "Pause"}
        </button>
        <button type="button" onClick={reset}>
          Reset
        </button>
        <button type="button" onClick={requestFullscreen}>
          Fullscreen
        </button>
      </footer>
    </main>
  );
}
