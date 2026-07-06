# Dynamic Sacred Geometry Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure-web 2D proof of concept that renders four crop-circle-inspired geometry families through a shared Geometry IR, scene graph, modulation engine, Canvas 2D renderer, WebGL2 energy field, and local Web Audio analysis pipeline.

**Architecture:** Geometry is data first: patterns are scene definitions composed of primitives, operators, relations, and modifiers. React owns UI state and orchestration only; static and dynamic visuals flow through `GeometryScene -> evaluateScene -> renderCanvas/renderEnergyField`. Audio never writes drawing properties directly; it maps local analyser features into normalized modulation state.

**Tech Stack:** Vite, React, TypeScript strict mode, Canvas 2D, WebGL2 fragment shader, Web Audio API, Vitest.

---

## Architecture Decision Summary

- Use a reusable Geometry IR instead of independent pattern components.
- Keep primitives declarative and normalized to a `0..1` coordinate space.
- Evaluate operators into renderable instances at runtime; do not store expanded petals or mirrored copies in source scenes.
- Keep modulation central in `ModulationState`; dynamic modifiers transform evaluated geometry from this state.
- Keep Canvas 2D responsible for crisp vector geometry and WebGL2 responsible for energy/interference fields.
- Use local-only audio: `File -> AudioContext -> AnalyserNode -> AudioFeatures -> ModulationState`.
- Cap DPR at `2`, use `ResizeObserver`, and run one `requestAnimationFrame` loop.
- Respect `prefers-reduced-motion` by reducing rotation, pulse, zoom, and high-frequency motion.

## Proposed File Tree

```text
src/
  app/
    App.tsx
    store.ts
  geometry/
    types.ts
    scene.ts
    evaluator/
      evaluateScene.ts
      transforms.ts
    primitives/
      pathBuilders.ts
      spiral.ts
    operators/
      radialRepeat.ts
      mirror.ts
      group.ts
  modulation/
    types.ts
    engine.ts
    autoTimeline.ts
    modifiers.ts
  renderer/
    canvas/
      CanvasLayer.ts
      CanvasRenderer.ts
      drawNode.ts
    webgl/
      EnergyRenderer.ts
      shaders.ts
  audio/
    AudioEngine.ts
    analyser.ts
    smoothing.ts
  patterns/
    axialCoupling.ts
    radialFloral.ts
    spiralField.ts
    triadicOrbital.ts
  ui/
    AudioUploader.tsx
    DebugPanel.tsx
    GeometryInspector.tsx
    ParameterPanel.tsx
    PatternSelector.tsx
    PlaybackControls.tsx
  utils/
    math.ts
    color.ts
test/
  geometry/
    evaluateScene.test.ts
    operators.test.ts
  modulation/
    engine.test.ts
    smoothing.test.ts
```

## TypeScript Geometry IR

```ts
export type Vec2 = readonly [number, number];
export type GeometryPrimitiveType =
  | "point"
  | "line"
  | "circle"
  | "arc"
  | "ellipse"
  | "polygon"
  | "polyline"
  | "bezier"
  | "spiral";

export interface GeometryStyle {
  stroke?: string;
  fill?: string;
  lineWidth?: number;
  alpha?: number;
  glow?: number;
  dash?: readonly number[];
}

interface BaseNode {
  id: string;
  type: GeometryPrimitiveType;
  style?: GeometryStyle;
  tags?: readonly string[];
}

export interface PointNode extends BaseNode {
  type: "point";
  position: Vec2;
  radius?: number;
}

export interface LineNode extends BaseNode {
  type: "line";
  from: Vec2;
  to: Vec2;
}

export interface CircleNode extends BaseNode {
  type: "circle";
  center: Vec2;
  radius: number;
}

export interface ArcNode extends BaseNode {
  type: "arc";
  center: Vec2;
  radius: number;
  startAngle: number;
  endAngle: number;
  clockwise?: boolean;
}

export interface EllipseNode extends BaseNode {
  type: "ellipse";
  center: Vec2;
  radiusX: number;
  radiusY: number;
  rotation?: number;
}

export interface PolygonNode extends BaseNode {
  type: "polygon";
  center: Vec2;
  radius: number;
  sides: number;
  rotation?: number;
}

export interface PolylineNode extends BaseNode {
  type: "polyline";
  points: readonly Vec2[];
  closed?: boolean;
}

export interface BezierNode extends BaseNode {
  type: "bezier";
  points: readonly Vec2[];
  closed?: boolean;
}

export interface SpiralNode extends BaseNode {
  type: "spiral";
  model: "archimedean" | "logarithmic";
  center: Vec2;
  a: number;
  b: number;
  thetaStart: number;
  thetaEnd: number;
  direction: "cw" | "ccw";
  samples?: number;
}

export type GeometryNode =
  | PointNode
  | LineNode
  | CircleNode
  | ArcNode
  | EllipseNode
  | PolygonNode
  | PolylineNode
  | BezierNode
  | SpiralNode;

export type RelationType =
  | "contains"
  | "overlaps"
  | "touches"
  | "tangent"
  | "intersects"
  | "connects"
  | "orbits"
  | "mirrors"
  | "repeats"
  | "nested_in"
  | "attached_to";

export interface GeometryRelation {
  type: RelationType;
  from: string;
  to: string;
}

export type SymmetryDefinition =
  | { type: "none" }
  | { type: "Cn"; order: number; center: Vec2 }
  | { type: "Dn"; order: number; center: Vec2 }
  | { type: "mirror" | "bilateral"; axis: "horizontal" | "vertical"; origin: Vec2 };

export type GeometryOperator =
  | {
      id: string;
      type: "radialRepeat";
      source: string;
      center: Vec2;
      count: number;
      startAngle?: number;
      angleStep?: number;
    }
  | {
      id: string;
      type: "mirror";
      source: string;
      axis: "horizontal" | "vertical";
      origin: Vec2;
    }
  | {
      id: string;
      type: "group";
      children: readonly string[];
    };

export interface ModulationState {
  time: number;
  energy: number;
  density: number;
  phase: number;
  breath: number;
  tension: number;
  coherence: number;
}

export type DynamicModifier =
  | { type: "breathe"; target: string; amplitude: number; frequency: number; phase?: number }
  | { type: "rotate"; target: string; speed: number; direction: "cw" | "ccw" }
  | { type: "counterRotate"; target: string; speed: number }
  | { type: "orbit"; target: string; center: Vec2; radius: number; speed: number; phase?: number }
  | { type: "phaseShift"; target: string; amount: number; source: "time" | "energy" | "audio" }
  | { type: "densityWave"; target: string; minDensity: number; maxDensity: number; frequency: number }
  | { type: "travelingPulse"; target: string; speed: number; width: number; intensity: number; loop: boolean }
  | { type: "compress"; target: string; amount: number; center?: Vec2 }
  | { type: "expand"; target: string; amount: number; center?: Vec2 }
  | { type: "dissolve"; target: string; amount: number };

export interface GeometryScene {
  id: string;
  name: string;
  canvas: {
    coordinateSystem: "normalized";
    background: string;
  };
  symmetry?: SymmetryDefinition;
  nodes: readonly GeometryNode[];
  operators?: readonly GeometryOperator[];
  relations?: readonly GeometryRelation[];
  modifiers?: readonly DynamicModifier[];
}
```

## Implementation Plan

### Milestone 1: Project Scaffold and Static Canvas Shell

- [x] Create Vite React TypeScript project files with `strict: true`.
- [x] Add Vitest with a minimal test script.
- [x] Build the shell with a full-viewport canvas stage, desktop sidebar region, and mobile bottom-sheet region.
- [x] Add a single animation loop using `requestAnimationFrame`.
- [x] Add `ResizeObserver`, HiDPI canvas sizing, and `Math.min(devicePixelRatio, 2)`.
- [x] Add pause/play, reset, fullscreen, and reduced-motion detection.

### Milestone 2: Geometry IR and Static Engine

- [x] Create `src/geometry/types.ts` from the IR above.
- [x] Implement primitive-to-path builders for point, line, circle, arc, ellipse, polygon, polyline, bezier, and spiral.
- [x] Implement normalized coordinate conversion from scene space to canvas pixels.
- [x] Add unit tests for polygon vertices, spiral sampling, and angle conversion.
- [x] Render a minimal static scene through the universal Canvas renderer.

### Milestone 3: Operators and Scene Evaluation

- [x] Implement `group` as scene graph composition.
- [x] Implement `radialRepeat` so Pattern B stores one petal prototype and expands it at evaluation time.
- [x] Implement `mirror` so Pattern D can generate bilateral structure without duplicating source geometry.
- [x] Add tests for radial repeat counts, group expansion, and mirror coordinates.

### Milestone 4: Four Static Reference Patterns

- [x] Add `triadicOrbital.ts` with outer boundary, central seed, three nested resonant nodes, C3 symmetry, and 0/120/240-degree relations.
- [x] Add `radialFloral.ts` with outer polygon, one bezier petal prototype, radial repeat defaulting to 16, inner star, and central rings.
- [x] Add `spiralField.ts` with a true parametric spiral, terminal nodes, and center singularity.
- [x] Add `axialCoupling.ts` with source circular node, C-shaped arcs, bridge, and mirror operator for the opposing side.
- [x] Verify all four render statically before adding animation.

### Milestone 5: Modulation Engine

- [x] Implement normalized `ModulationState` and clamping helpers.
- [x] Implement auto-mode 60-second loop: awaken, breath, energy build, interference, compression, singularity, expansion, dissolution.
- [x] Add user parameter overrides for energy, density, phase, breath, tension, and coherence.
- [x] Add unit tests for clamping, timeline segments, and reduced-motion scaling.

### Milestone 6: Dynamic Modifiers

- [x] Implement breathe, rotate, counterRotate, orbit, phaseShift, densityWave, travelingPulse, compress, expand, and dissolve.
- [x] Apply modifiers during scene evaluation, after operators have created evaluated instances.
- [x] Ensure Pattern A breathes and rotates with 120-degree phase offsets.
- [x] Ensure Pattern B supports real-time petal count from 8 to 32.
- [x] Ensure Pattern C has a visible traveling pulse.
- [x] Ensure Pattern D ping-pongs energy across the bridge.

### Milestone 7: WebGL2 Energy Field

- [x] Add a separate full-stage WebGL2 layer behind or composited with Canvas 2D.
- [x] Implement uniforms for time, energy, density, phase, tension, node count, and wave source nodes.
- [x] Implement radial waves, multi-source interference, dense-to-sparse modulation, compression, expansion, phase drift, noise distortion, and soft glow.
- [x] Keep color restrained: near-black, graphite, silver-gray, subtle spectral accents.

### Milestone 8: Local Audio Reactive Mode

- [ ] Implement local audio file input for `.mp3`, `.wav`, and `.m4a`.
- [ ] Create `AudioContext`, media element/source, and `AnalyserNode`.
- [ ] Extract RMS, sub `20-90 Hz`, low `90-300 Hz`, mid `300-2000 Hz`, and high `2k-10k Hz`.
- [ ] Apply attack/release smoothing before updating modulation.
- [ ] Map bands only into `ModulationState`, never directly into drawing properties.

### Milestone 9: Controls, Debug, and Inspector

- [ ] Add pattern selector, auto/audio mode toggle, parameter controls, reset, pause/play, fullscreen, and copy JSON.
- [ ] Add Geometry JSON inspector showing scene, nodes, relations, operators, and modifiers.
- [ ] Add debug mode via `?debug=true` and UI toggle.
- [ ] Debug panel shows FPS, time, energy, density, phase, canvas size, audio bands, and active node count.
- [ ] Add optional overlays for control points, bounding boxes, centers, and symmetry axes.

### Milestone 10: Verification and Polish

- [ ] Run unit tests.
- [ ] Verify all acceptance criteria from the PRD.
- [ ] Test desktop responsive layout and mobile bottom sheet.
- [ ] Test prefers-reduced-motion behavior.
- [ ] Profile FPS and keep average at or above 45 FPS on desktop.
- [ ] Start the local dev server and provide the URL.

## Milestone Checklist

- [x] Architecture established before UI implementation.
- [x] Geometry IR supports all required primitives.
- [x] Operators support `radialRepeat`, `mirror`, and `group`.
- [x] Relations include the PRD-required topology vocabulary.
- [x] Four static patterns render through the same evaluator and renderer.
- [x] Modulation engine is shared across every pattern.
- [x] WebGL2 energy layer is independent from vector geometry.
- [ ] Audio pipeline is local-only and maps into modulation state.
- [ ] Debug and JSON inspector are available.
- [ ] Responsive, fullscreen, HiDPI, reduced-motion, and RAF requirements are met.
