import type { ModulationState } from "../../geometry/types";
import type { EnergyNode, EnergyUniformSnapshot } from "./types";
import { clamp } from "../../utils/math";

const maxEnergyNodes = 8;

export function createEnergyUniformSnapshot(
  modulation: ModulationState,
  nodes: readonly EnergyNode[],
  resolution: readonly [number, number] = [1, 1]
): EnergyUniformSnapshot {
  const nodeData = new Float32Array(maxEnergyNodes * 4);
  nodes.slice(0, maxEnergyNodes).forEach((node, index) => {
    const offset = index * 4;
    nodeData[offset] = node.x;
    nodeData[offset + 1] = node.y;
    nodeData[offset + 2] = node.amplitude;
    nodeData[offset + 3] = node.frequency + node.phase;
  });

  return {
    time: modulation.time,
    energy: clamp(modulation.energy, 0, 1),
    density: clamp(modulation.density, 0, 1),
    phase: clamp(modulation.phase, 0, 1),
    tension: clamp(modulation.tension, 0, 1),
    nodeCount: Math.min(nodes.length, maxEnergyNodes),
    nodeData,
    resolution
  };
}
