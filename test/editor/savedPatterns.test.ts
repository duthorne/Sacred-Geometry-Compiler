import { describe, expect, test } from "vitest";
import { buildEditorScene, starterEditorElements } from "../../src/editor/editorScene";
import { deleteSavedPattern, saveEditorSceneAsPattern, updateSavedPattern } from "../../src/editor/savedPatterns";

describe("saved editor patterns", () => {
  test("saveEditorSceneAsPattern creates a selectable custom pattern scene", () => {
    const scene = buildEditorScene(starterEditorElements);
    const saved = saveEditorSceneAsPattern([], scene);

    expect(saved).toHaveLength(1);
    expect(saved[0].scene.id).toBe("custom-pattern-1");
    expect(saved[0].scene.name).toBe("Custom Pattern 1");
    expect(saved[0].scene.nodes).toHaveLength(scene.nodes.length);
  });

  test("saveEditorSceneAsPattern appends unique pattern ids", () => {
    const scene = buildEditorScene(starterEditorElements);
    const first = saveEditorSceneAsPattern([], scene);
    const second = saveEditorSceneAsPattern(first, scene);

    expect(second.map((pattern) => pattern.id)).toEqual(["custom-pattern-1", "custom-pattern-2"]);
  });

  test("deleteSavedPattern removes only the requested custom pattern", () => {
    const scene = buildEditorScene(starterEditorElements);
    const saved = saveEditorSceneAsPattern(saveEditorSceneAsPattern([], scene), scene);
    const remaining = deleteSavedPattern(saved, "custom-pattern-1");

    expect(remaining.map((pattern) => pattern.id)).toEqual(["custom-pattern-2"]);
  });

  test("saveEditorSceneAsPattern stores a custom name and editable editor state", () => {
    const scene = buildEditorScene(starterEditorElements);
    const saved = saveEditorSceneAsPattern([], scene, {
      name: "Orbital Draft",
      editorState: { elements: starterEditorElements, groups: [] }
    });

    expect(saved[0].scene.name).toBe("Orbital Draft");
    expect(saved[0].editorState?.elements).toHaveLength(starterEditorElements.length);
  });

  test("updateSavedPattern replaces an existing saved pattern without changing its id", () => {
    const scene = buildEditorScene(starterEditorElements);
    const saved = saveEditorSceneAsPattern([], scene, { name: "Draft A", editorState: { elements: starterEditorElements, groups: [] } });
    const updated = updateSavedPattern(saved, saved[0].id, scene, {
      name: "Draft B",
      editorState: { elements: starterEditorElements.slice(0, 1), groups: [] }
    });

    expect(updated).toHaveLength(1);
    expect(updated[0].id).toBe(saved[0].id);
    expect(updated[0].scene.name).toBe("Draft B");
    expect(updated[0].editorState?.elements).toHaveLength(1);
  });
});
