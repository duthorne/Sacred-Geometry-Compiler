import type { GeometryScene } from "../geometry/types";
import type { EditorElement, EditorGroup } from "./editorScene";

export interface SavedPattern {
  id: string;
  scene: GeometryScene;
  editorState?: {
    elements: readonly EditorElement[];
    groups: readonly EditorGroup[];
  };
}

interface SavePatternOptions {
  name?: string;
  editorState?: SavedPattern["editorState"];
}

export const savedPatternsStorageKey = "dynamic-sacred-geometry.saved-patterns";

function nextPatternNumber(savedPatterns: readonly SavedPattern[]): number {
  const usedNumbers = savedPatterns
    .map((pattern) => Number(pattern.id.replace("custom-pattern-", "")))
    .filter((value) => Number.isFinite(value));
  return Math.max(0, ...usedNumbers) + 1;
}

function cloneScene(scene: GeometryScene, id: string, name: string): GeometryScene {
  return {
    ...scene,
    id,
    name,
    nodes: scene.nodes.map((node) => ({ ...node })),
    operators: scene.operators ? scene.operators.map((operator) => ({ ...operator })) : undefined,
    relations: scene.relations ? scene.relations.map((relation) => ({ ...relation })) : undefined,
    modifiers: scene.modifiers ? scene.modifiers.map((modifier) => ({ ...modifier })) : undefined
  };
}

export function saveEditorSceneAsPattern(savedPatterns: readonly SavedPattern[], scene: GeometryScene, options: SavePatternOptions = {}): SavedPattern[] {
  const patternNumber = nextPatternNumber(savedPatterns);
  const id = `custom-pattern-${patternNumber}`;
  const savedScene = cloneScene(scene, id, options.name?.trim() || `Custom Pattern ${patternNumber}`);
  return [...savedPatterns, { id, scene: savedScene, editorState: options.editorState }];
}

export function updateSavedPattern(
  savedPatterns: readonly SavedPattern[],
  id: string,
  scene: GeometryScene,
  options: SavePatternOptions = {}
): SavedPattern[] {
  return savedPatterns.map((pattern) => {
    if (pattern.id !== id) {
      return pattern;
    }
    const savedScene = cloneScene(scene, id, options.name?.trim() || pattern.scene.name);
    return { id, scene: savedScene, editorState: options.editorState };
  });
}

export function deleteSavedPattern(savedPatterns: readonly SavedPattern[], id: string): SavedPattern[] {
  return savedPatterns.filter((pattern) => pattern.id !== id);
}

export function loadSavedPatterns(storage: Storage): SavedPattern[] {
  try {
    const rawValue = storage.getItem(savedPatternsStorageKey);
    if (!rawValue) {
      return [];
    }
    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsedValue)) {
      return [];
    }
    return parsedValue.filter((pattern): pattern is SavedPattern => {
      return (
        typeof pattern === "object" &&
        pattern !== null &&
        "id" in pattern &&
        "scene" in pattern &&
        typeof pattern.id === "string" &&
        typeof pattern.scene === "object"
      );
    });
  } catch {
    return [];
  }
}

export function persistSavedPatterns(storage: Storage, savedPatterns: readonly SavedPattern[]): void {
  storage.setItem(savedPatternsStorageKey, JSON.stringify(savedPatterns));
}
