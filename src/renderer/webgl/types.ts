import type { Vec2 } from "../../geometry/types";

export interface EnergyNode {
  x: number;
  y: number;
  amplitude: number;
  frequency: number;
  phase: number;
}

export interface EnergyUniformSnapshot {
  time: number;
  energy: number;
  density: number;
  phase: number;
  tension: number;
  nodeCount: number;
  nodeData: Float32Array;
  resolution: Vec2;
}
