import { describe, expect, test } from "vitest";
import {
  alignSelected,
  assignOrbitTarget,
  createEditorGroup,
  createPenBezierElement,
  distributeSelected,
  moveElementsFromDragStart,
  mirrorSelectedAroundCenter,
  removeEditorElement,
  moveElementsByDelta,
  moveGroupsForMovedElements,
  moveLayerDown,
  moveLayerToBottom,
  moveLayerToTop,
  moveLayerUp,
  rotateElementToward,
  scaleElementToward,
  selectElementAt
} from "../../src/editor/editorOperations";
import { buildEditorScene, createEditorElement, updateEditorElement } from "../../src/editor/editorScene";

describe("editor operations", () => {
  test("selectElementAt returns one specific element when two elements share a primitive type", () => {
    const first = updateEditorElement(createEditorElement("circle", 0), { center: [0.25, 0.5] });
    const second = updateEditorElement(createEditorElement("circle", 1), { center: [0.75, 0.5] });

    expect(selectElementAt([first, second], [0.76, 0.5])).toBe(second.id);
  });

  test("rotateElementToward and scaleElementToward update angle and size from canvas points", () => {
    const element = updateEditorElement(createEditorElement("line", 0), { center: [0.5, 0.5], size: 0.1, rotation: 0 });
    const rotated = rotateElementToward(element, [0.5, 0.2]);
    const scaled = scaleElementToward(element, [0.8, 0.5]);

    expect(rotated.rotation).toBeCloseTo(-Math.PI / 2);
    expect(scaled.size).toBeCloseTo(0.3);
  });

  test("line elements preserve static rotation in generated geometry", () => {
    const line = updateEditorElement(createEditorElement("line", 0), {
      center: [0.5, 0.5],
      size: 0.1,
      rotation: Math.PI / 2
    });
    const scene = buildEditorScene([line]);
    const node = scene.nodes[0];

    expect(node).toMatchObject({ type: "line" });
    if (node.type === "line") {
      expect(node.from[0]).toBeCloseTo(0.5);
      expect(node.to[0]).toBeCloseTo(0.5);
      expect(node.from[1]).toBeCloseTo(0.4);
      expect(node.to[1]).toBeCloseTo(0.6);
    }
  });

  test("invisible orbit target stays out of rendering while driving another element along its path", () => {
    const target = updateEditorElement(createEditorElement("circle", 0), { id: "guide", center: [0.4, 0.4], visible: false });
    const moving = updateEditorElement(createEditorElement("circle", 1), { id: "moving", center: [0.6, 0.4] });
    const elements = assignOrbitTarget([target, moving], "moving", "guide");
    const scene = buildEditorScene(elements);

    expect(scene.nodes.find((node) => node.id === "guide")?.style?.alpha).toBe(0);
    expect(scene.modifiers?.find((modifier) => modifier.target === "moving")).toMatchObject({
      type: "followPath",
      target: "moving",
      speed: 1,
      phase: 0.125,
      pingPong: true
    });
  });

  test("quarter arc and pen bezier generate expected primitives", () => {
    const arc = createEditorElement("quarterArc", 0);
    const bezier = createPenBezierElement(
      [
        [0.1, 0.1],
        [0.2, 0.3],
        [0.4, 0.3],
        [0.5, 0.1]
      ],
      1
    );
    const scene = buildEditorScene([arc, bezier]);

    expect(scene.nodes[0]).toMatchObject({ type: "arc" });
    expect(scene.nodes[1]).toMatchObject({ type: "bezier", points: bezier.points });
  });

  test("multi-select helpers mirror align and distribute selected elements", () => {
    const elements = [
      updateEditorElement(createEditorElement("circle", 0), { id: "a", center: [0.2, 0.2] }),
      updateEditorElement(createEditorElement("circle", 1), { id: "b", center: [0.4, 0.5] }),
      updateEditorElement(createEditorElement("circle", 2), { id: "c", center: [0.8, 0.8] })
    ];

    const mirrored = mirrorSelectedAroundCenter(elements, ["a"], [0.5, 0.5]);
    const aligned = alignSelected(elements, ["a", "b", "c"], "horizontal");
    const distributed = distributeSelected(elements, ["a", "b", "c"], "horizontal");

    expect(mirrored.find((element) => element.id === "a")?.center).toEqual([0.8, 0.8]);
    expect(aligned.map((element) => element.center[1])).toEqual([0.5, 0.5, 0.5]);
    expect(distributed.map((element) => element.center[0])).toEqual([0.2, 0.5, 0.8]);
  });

  test("moveElementsByDelta drags selected elements and preserves unselected elements", () => {
    const elements = [
      updateEditorElement(createEditorElement("circle", 0), { id: "a", center: [0.2, 0.2] }),
      updateEditorElement(createEditorElement("bezier", 1), {
        id: "b",
        center: [0.4, 0.4],
        points: [
          [0.3, 0.3],
          [0.4, 0.5]
        ]
      }),
      updateEditorElement(createEditorElement("circle", 2), { id: "c", center: [0.8, 0.8] })
    ];

    const moved = moveElementsByDelta(elements, ["a", "b"], [0.1, -0.05]);

    expect(moved.find((element) => element.id === "a")?.center).toEqual([0.30000000000000004, 0.15000000000000002]);
    expect(moved.find((element) => element.id === "b")?.points).toEqual([
      [0.4, 0.25],
      [0.5, 0.45]
    ]);
    expect(moved.find((element) => element.id === "c")?.center).toEqual([0.8, 0.8]);
  });

  test("moveElementsFromDragStart computes drag from the original snapshot to avoid pointermove drift", () => {
    const elements = [
      updateEditorElement(createEditorElement("circle", 0), { id: "a", center: [0.2, 0.2] }),
      updateEditorElement(createEditorElement("circle", 1), { id: "b", center: [0.4, 0.4] })
    ];

    const moved = moveElementsFromDragStart(elements, ["a"], [0.2, 0.2], [0.5, 0.5]);

    expect(moved.find((element) => element.id === "a")?.center).toEqual([0.5, 0.5]);
    expect(moved.find((element) => element.id === "b")?.center).toEqual([0.4, 0.4]);
  });

  test("createEditorGroup computes group center from selected elements", () => {
    const elements = [
      updateEditorElement(createEditorElement("circle", 0), { id: "a", center: [0.2, 0.4] }),
      updateEditorElement(createEditorElement("circle", 1), { id: "b", center: [0.6, 0.4] })
    ];

    expect(createEditorGroup(elements, ["a", "b"], 0)).toMatchObject({
      id: "editor-group-1",
      elementIds: ["a", "b"],
      center: [0.4, 0.4],
      motionType: "none"
    });
  });

  test("moveGroupsForMovedElements moves group center when every child is dragged", () => {
    const group = createEditorGroup(
      [
        updateEditorElement(createEditorElement("circle", 0), { id: "a", center: [0.2, 0.4] }),
        updateEditorElement(createEditorElement("circle", 1), { id: "b", center: [0.6, 0.4] })
      ],
      ["a", "b"],
      0
    );

    expect(moveGroupsForMovedElements([group], ["a", "b"], [0.1, 0.05])[0].center).toEqual([0.5, 0.45]);
    expect(moveGroupsForMovedElements([group], ["a"], [0.1, 0.05])[0].center).toEqual([0.4, 0.4]);
  });

  test("removeEditorElement allows deleting the only element and clears selection", () => {
    const element = updateEditorElement(createEditorElement("circle", 0), { id: "a" });

    expect(removeEditorElement([element], [], "a")).toEqual({
      elements: [],
      groups: [],
      selectedIds: [],
      selectedId: "",
      selectedGroupId: null
    });
  });

  test("layer helpers move elements up down top and bottom", () => {
    const elements = [
      updateEditorElement(createEditorElement("circle", 0), { id: "a", layer: 0 }),
      updateEditorElement(createEditorElement("circle", 1), { id: "b", layer: 1 }),
      updateEditorElement(createEditorElement("circle", 2), { id: "c", layer: 2 })
    ];

    expect(moveLayerUp(elements, "a").find((element) => element.id === "a")?.layer).toBe(1);
    expect(moveLayerDown(elements, "c").find((element) => element.id === "c")?.layer).toBe(1);
    expect(moveLayerToTop(elements, "a").find((element) => element.id === "a")?.layer).toBe(3);
    expect(moveLayerToBottom(elements, "c").find((element) => element.id === "c")?.layer).toBe(-1);
  });
});
