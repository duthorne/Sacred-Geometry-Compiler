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
  role?: "prototype" | "guide";
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
  rotation?: number;
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
  | { type: "rotate"; target: string; speed: number; direction: "cw" | "ccw"; origin?: Vec2 }
  | { type: "counterRotate"; target: string; speed: number; origin?: Vec2 }
  | { type: "orbit"; target: string; center: Vec2; radius: number; speed: number; phase?: number }
  | {
      type: "followPath";
      target: string;
      path: readonly Vec2[];
      speed: number;
      phase?: number;
      pingPong: boolean;
      rotateWith?: { center: Vec2; speed: number; direction: "cw" | "ccw" };
    }
  | {
      type: "spiralOrbit";
      target: string;
      center: Vec2;
      minRadius: number;
      maxRadius: number;
      angularSpeed: number;
      radialFrequency: number;
      phase?: number;
    }
  | { type: "phaseShift"; target: string; amount: number; source: "time" | "energy" | "audio" }
  | { type: "densityWave"; target: string; minDensity: number; maxDensity: number; frequency: number }
  | { type: "travelingPulse"; target: string; speed: number; width: number; intensity: number; loop: boolean }
  | { type: "fillPulse"; target: string; fill: string; frequency: number; phase?: number }
  | { type: "areaPulse"; target: string; minArea: number; maxArea: number; frequency: number; phase?: number }
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

export interface NodeTransform {
  origin: Vec2;
  rotationOrigin?: Vec2;
  rotation: number;
  scale: Vec2;
  translate: Vec2;
}

export interface EvaluatedGeometryNode {
  id: string;
  sourceId: string;
  node: GeometryNode;
  transform: NodeTransform;
}

export interface EvaluatedGeometryScene {
  id: string;
  name: string;
  background: string;
  nodes: readonly EvaluatedGeometryNode[];
  relations: readonly GeometryRelation[];
}
