import type { GeometryScene } from "../geometry/types";
import { axialCoupling } from "./axialCoupling";
import { quadrantOracle } from "./quadrantOracle";
import { radialFloral } from "./radialFloral";
import { spiralField } from "./spiralField";
import { triadicOrbital } from "./triadicOrbital";
import { triuneAperture } from "./triuneAperture";
import { vortexMandala } from "./vortexMandala";

export const patterns = [triadicOrbital, radialFloral, spiralField, axialCoupling, vortexMandala, triuneAperture, quadrantOracle] as const satisfies readonly GeometryScene[];

export type PatternId = (typeof patterns)[number]["id"];

export function findPattern(id: string): GeometryScene {
  return patterns.find((pattern) => pattern.id === id) ?? triadicOrbital;
}
