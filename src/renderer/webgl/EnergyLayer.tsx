import { type ReactElement, useEffect, useRef } from "react";
import type { GeometryScene, ModulationState } from "../../geometry/types";
import { evaluateScene } from "../../geometry/evaluator/evaluateScene";
import { collectEnergyNodes } from "./energyNodes";
import { createEnergyUniformSnapshot } from "./uniforms";
import { EnergyRenderer } from "./EnergyRenderer";

interface EnergyLayerProps {
  scene: GeometryScene;
  modulation: ModulationState;
}

export function EnergyLayer({ scene, modulation }: EnergyLayerProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<EnergyRenderer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const render = (): void => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      try {
        rendererRef.current ??= new EnergyRenderer(canvas);
        const evaluated = evaluateScene(scene, modulation);
        const energyNodes = collectEnergyNodes(evaluated);
        const snapshot = createEnergyUniformSnapshot(modulation, energyNodes, [width, height]);
        rendererRef.current.render(snapshot, width, height);
      } catch {
        const context = canvas.getContext("2d");
        context?.clearRect(0, 0, width, height);
      }
    };

    const resizeObserver = new ResizeObserver(render);
    resizeObserver.observe(canvas);
    render();

    return () => {
      resizeObserver.disconnect();
    };
  }, [modulation, scene]);

  return <canvas ref={canvasRef} className="energy-canvas" aria-hidden="true" />;
}
