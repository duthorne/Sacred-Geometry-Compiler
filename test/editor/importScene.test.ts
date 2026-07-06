import { describe, expect, test } from "vitest";
import { createEditorStateFromScene } from "../../src/editor/importScene";
import { vortexMandala } from "../../src/patterns/vortexMandala";

describe("default pattern import", () => {
  test("creates editable elements from an evaluated default scene without mutating the default pattern id", () => {
    const state = createEditorStateFromScene(vortexMandala);

    expect(vortexMandala.id).toBe("vortex-mandala");
    expect(state.name).toBe("Vortex Mandala Copy");
    expect(state.elements.length).toBeGreaterThan(6);
    expect(state.groups).toEqual([]);
    expect(state.elements.map((element) => element.layer)).toEqual(state.elements.map((_, index) => index));
  });
});
