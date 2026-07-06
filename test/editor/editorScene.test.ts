import { describe, expect, test } from "vitest";
import { buildEditorScene, createEditorElement, updateEditorElement, type EditorGroup } from "../../src/editor/editorScene";

describe("geometry editor scene builder", () => {
  test("creates fillable primitive nodes for circle triangle ellipse spiral and bezier", () => {
    const elements = [
      createEditorElement("circle", 0),
      createEditorElement("triangle", 1),
      createEditorElement("ellipse", 2),
      createEditorElement("spiral", 3),
      createEditorElement("bezier", 4)
    ].map((element) => updateEditorElement(element, { filled: true }));

    const scene = buildEditorScene(elements);

    expect(scene.nodes.map((node) => node.type)).toEqual(["circle", "polygon", "ellipse", "spiral", "bezier"]);
    expect(scene.nodes[1]).toMatchObject({ type: "polygon", sides: 3 });
    scene.nodes.forEach((node) => {
      expect(node.style?.fill).toBeTruthy();
    });
  });

  test("turns element motion settings into shared dynamic modifiers", () => {
    const rotating = updateEditorElement(createEditorElement("circle", 0), {
      motionType: "rotate",
      direction: "cw",
      speed: 4
    });
    const orbiting = updateEditorElement(createEditorElement("ellipse", 1), {
      motionType: "orbit",
      orbitRadius: 0.08,
      speed: 0.5
    });

    const scene = buildEditorScene([rotating, orbiting]);

    expect(scene.modifiers).toEqual([
      { type: "rotate", target: rotating.id, speed: 4, direction: "cw", origin: rotating.center },
      { type: "orbit", target: orbiting.id, center: orbiting.center, radius: 0.08, speed: 0.5, phase: orbiting.phase }
    ]);
  });

  test("keeps editor scenes compatible with the geometry pipeline", () => {
    const scene = buildEditorScene([
      updateEditorElement(createEditorElement("spiral", 0), { motionType: "counterRotate", speed: 2 }),
      updateEditorElement(createEditorElement("bezier", 1), { motionType: "breathe", amplitude: 0.1 })
    ]);

    expect(scene.canvas.coordinateSystem).toBe("normalized");
    expect(scene.relations).toContainEqual({ type: "attached_to", from: scene.nodes[1].id, to: scene.nodes[0].id });
    expect(scene.modifiers?.map((modifier) => modifier.type)).toEqual(["counterRotate", "breathe"]);
  });

  test("turns editor groups into IR group operators and group-level motion modifiers", () => {
    const elements = [
      updateEditorElement(createEditorElement("circle", 0), { id: "a", center: [0.2, 0.4] }),
      updateEditorElement(createEditorElement("circle", 1), { id: "b", center: [0.6, 0.4] })
    ];
    const group: EditorGroup = {
      id: "group-a",
      name: "Group 1",
      elementIds: ["a", "b"],
      center: [0.4, 0.4],
      motionType: "rotate",
      direction: "ccw",
      speed: 0.7,
      amplitude: 0.05,
      orbitRadius: 0.1,
      phase: 0
    };

    const scene = buildEditorScene(elements, [group]);

    expect(scene.operators).toContainEqual({ id: "group-a", type: "group", children: ["a", "b"] });
    expect(scene.modifiers).toContainEqual({ type: "rotate", target: "a", speed: 0.7, direction: "ccw", origin: [0.4, 0.4] });
    expect(scene.modifiers).toContainEqual({ type: "rotate", target: "b", speed: 0.7, direction: "ccw", origin: [0.4, 0.4] });
  });

  test("sorts editor elements by layer before rendering", () => {
    const back = updateEditorElement(createEditorElement("circle", 0), { id: "back", layer: -1 });
    const front = updateEditorElement(createEditorElement("circle", 1), { id: "front", layer: 2 });
    const middle = updateEditorElement(createEditorElement("circle", 2), { id: "middle", layer: 0 });

    expect(buildEditorScene([front, back, middle]).nodes.map((node) => node.id)).toEqual(["back", "middle", "front"]);
  });
});
