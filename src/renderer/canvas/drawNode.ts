import type { GeometryNode, Vec2 } from "../../geometry/types";
import { polygonPoints, sampleSpiral } from "../../geometry/primitives/pathBuilders";
import { degreesToRadians } from "../../utils/math";

export interface CanvasMetrics {
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function toCanvasPoint(point: Vec2, metrics: CanvasMetrics): [number, number] {
  return [metrics.offsetX + point[0] * metrics.scale, metrics.offsetY + point[1] * metrics.scale];
}

export function toCanvasLength(value: number, metrics: CanvasMetrics): number {
  return value * metrics.scale;
}

function drawPoint(ctx: CanvasRenderingContext2D, node: Extract<GeometryNode, { type: "point" }>, metrics: CanvasMetrics): void {
  const [x, y] = toCanvasPoint(node.position, metrics);
  ctx.arc(x, y, toCanvasLength(node.radius ?? 0.008, metrics), 0, Math.PI * 2);
}

function drawLine(ctx: CanvasRenderingContext2D, node: Extract<GeometryNode, { type: "line" }>, metrics: CanvasMetrics): void {
  const [x1, y1] = toCanvasPoint(node.from, metrics);
  const [x2, y2] = toCanvasPoint(node.to, metrics);
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
}

function drawPolyline(ctx: CanvasRenderingContext2D, points: readonly Vec2[], closed: boolean, metrics: CanvasMetrics): void {
  points.forEach((point, index) => {
    const [x, y] = toCanvasPoint(point, metrics);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  if (closed) {
    ctx.closePath();
  }
}

export function buildNodePath(ctx: CanvasRenderingContext2D, node: GeometryNode, metrics: CanvasMetrics): void {
  ctx.beginPath();

  if (node.type === "point") {
    drawPoint(ctx, node, metrics);
    return;
  }
  if (node.type === "line") {
    drawLine(ctx, node, metrics);
    return;
  }
  if (node.type === "circle") {
    const [x, y] = toCanvasPoint(node.center, metrics);
    ctx.arc(x, y, toCanvasLength(node.radius, metrics), 0, Math.PI * 2);
    return;
  }
  if (node.type === "arc") {
    const [x, y] = toCanvasPoint(node.center, metrics);
    ctx.arc(x, y, toCanvasLength(node.radius, metrics), node.startAngle, node.endAngle, node.clockwise ?? false);
    return;
  }
  if (node.type === "ellipse") {
    const [x, y] = toCanvasPoint(node.center, metrics);
    ctx.ellipse(
      x,
      y,
      toCanvasLength(node.radiusX, metrics),
      toCanvasLength(node.radiusY, metrics),
      node.rotation ?? 0,
      0,
      Math.PI * 2
    );
    return;
  }
  if (node.type === "polygon") {
    drawPolyline(ctx, polygonPoints(node), true, metrics);
    return;
  }
  if (node.type === "polyline") {
    drawPolyline(ctx, node.points, node.closed ?? false, metrics);
    return;
  }
  if (node.type === "bezier") {
    const points = node.points;
    if (points.length < 4) {
      drawPolyline(ctx, points, node.closed ?? false, metrics);
      return;
    }
    const [startX, startY] = toCanvasPoint(points[0], metrics);
    ctx.moveTo(startX, startY);
    for (let index = 1; index + 2 < points.length; index += 3) {
      const [c1x, c1y] = toCanvasPoint(points[index], metrics);
      const [c2x, c2y] = toCanvasPoint(points[index + 1], metrics);
      const [endX, endY] = toCanvasPoint(points[index + 2], metrics);
      ctx.bezierCurveTo(c1x, c1y, c2x, c2y, endX, endY);
    }
    if (node.closed) {
      ctx.closePath();
    }
    return;
  }
  if (node.type === "spiral") {
    drawPolyline(ctx, sampleSpiral(node), false, metrics);
    return;
  }

  const exhaustive: never = node;
  throw new Error(`Unsupported node type: ${String(exhaustive)}`);
}

export function rotateCanvas(ctx: CanvasRenderingContext2D, rotationDegrees: number, origin: Vec2, metrics: CanvasMetrics): void {
  const [x, y] = toCanvasPoint(origin, metrics);
  ctx.translate(x, y);
  ctx.rotate(degreesToRadians(rotationDegrees));
  ctx.translate(-x, -y);
}
