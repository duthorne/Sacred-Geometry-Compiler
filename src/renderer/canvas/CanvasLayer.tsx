import { type ReactElement, useEffect, useRef } from "react";
import type { GeometryScene, ModulationState } from "../../geometry/types";
import { evaluateScene } from "../../geometry/evaluator/evaluateScene";
import { CanvasRenderer } from "./CanvasRenderer";

interface CanvasLayerProps {
  scene: GeometryScene;
  modulation: ModulationState;
}

export function CanvasLayer({ scene, modulation }: CanvasLayerProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef(new CanvasRenderer());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");
    if (!context) {
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

      rendererRef.current.render(context, evaluateScene(scene, modulation), width, height);
    };

    const resizeObserver = new ResizeObserver(render);
    resizeObserver.observe(canvas);
    render();

    return () => {
      resizeObserver.disconnect();
    };
  }, [modulation, scene]);

  return <canvas ref={canvasRef} className="geometry-canvas" aria-label={`${scene.name} geometry canvas`} />;
}
