import type { EvaluatedGeometryScene, GeometryStyle, NodeTransform } from "../../geometry/types";
import { buildNodePath, rotateCanvas, toCanvasPoint, type CanvasMetrics } from "./drawNode";

const defaultStyle: Required<Pick<GeometryStyle, "stroke" | "lineWidth" | "alpha" | "glow">> = {
  stroke: "rgba(213, 218, 218, 0.74)",
  lineWidth: 0.0017,
  alpha: 0.9,
  glow: 0.01
};

function applyTransform(ctx: CanvasRenderingContext2D, transform: NodeTransform, metrics: CanvasMetrics): void {
  ctx.translate(transform.translate[0] * metrics.scale, transform.translate[1] * metrics.scale);
  const [originX, originY] = toCanvasPoint(transform.origin, metrics);
  ctx.translate(originX, originY);
  ctx.scale(transform.scale[0], transform.scale[1]);
  ctx.translate(-originX, -originY);
  rotateCanvas(ctx, transform.rotation, transform.rotationOrigin ?? transform.origin, metrics);
}

function applyStyle(ctx: CanvasRenderingContext2D, style: GeometryStyle | undefined, metrics: CanvasMetrics): void {
  const merged = { ...defaultStyle, ...style };
  ctx.globalAlpha = merged.alpha;
  ctx.strokeStyle = merged.stroke;
  ctx.fillStyle = style?.fill ?? "transparent";
  ctx.lineWidth = Math.max(1, merged.lineWidth * metrics.scale);
  ctx.shadowColor = merged.stroke;
  ctx.shadowBlur = merged.glow * metrics.scale;
  ctx.setLineDash(style?.dash ? style.dash.map((dash) => dash * metrics.scale) : []);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

export class CanvasRenderer {
  render(ctx: CanvasRenderingContext2D, scene: EvaluatedGeometryScene, width: number, height: number): void {
    const scale = Math.min(width, height);
    const metrics: CanvasMetrics = {
      width,
      height,
      scale,
      offsetX: (width - scale) / 2,
      offsetY: (height - scale) / 2
    };

    ctx.clearRect(0, 0, width, height);

    scene.nodes.forEach((evaluatedNode) => {
      ctx.save();
      applyTransform(ctx, evaluatedNode.transform, metrics);
      applyStyle(ctx, evaluatedNode.node.style, metrics);
      buildNodePath(ctx, evaluatedNode.node, metrics);
      if (evaluatedNode.node.style?.fill) {
        ctx.fill();
      }
      ctx.stroke();
      ctx.restore();
    });
  }
}
