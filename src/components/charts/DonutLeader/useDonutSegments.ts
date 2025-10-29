import { useMemo } from "react";
import { polarToXY, TAU } from "./donutGeometry";
import type { DonutItem, DonutLabel, DonutSegment } from "./DonutLeader.types";
import { forceNewlineAfterLimit, wrapAtMostTwoLines } from "./donutTextUtils";

interface UseDonutSegmentsParams {
  items: DonutItem[];
  total: number;
  cx: number;
  cy: number;
  rOuter: number;
  gapRad: number;
  vbW: number;
  leaderLineLen: { radial: number; horizontal: number };
  labelFormatter: (d: { label: string; value: number; pct: number }) => string;
  fontSpec: string;
}

interface DonutSegmentsResult {
  segments: DonutSegment[];
  labels: DonutLabel[];
}

/**
 * Hook para calcular segmentos del donut y sus labels con leader lines
 */
export function useDonutSegments({
  items,
  total,
  cx,
  cy,
  rOuter,
  gapRad,
  vbW,
  leaderLineLen,
  labelFormatter,
  fontSpec,
}: UseDonutSegmentsParams): DonutSegmentsResult {
  const segments = useMemo(() => {
    let acc = 0;
    return items.map((d) => {
      const frac = total > 0 ? d.value / total : 0;
      const start = acc;
      const end = acc + Math.max(frac * TAU - gapRad, 0);
      acc += frac * TAU;
      const mid = (start + end) / 2;
      const pct = total > 0 ? (d.value / total) * 100 : 0;
      return { data: d, start, end, mid, pct };
    });
  }, [items, total, gapRad]);

  const labels = useMemo(() => {
    return segments.map((s, idx) => {
      const p = polarToXY(cx, cy, rOuter, s.mid);
      const p2 = polarToXY(cx, cy, rOuter + leaderLineLen.radial, s.mid);
      const isRight = Math.cos(s.mid) >= 0;

      const xEnd =
        p2.x + (isRight ? leaderLineLen.horizontal : -leaderLineLen.horizontal);
      const yEnd = p2.y;

      const textAnchor = (isRight ? "start" : "end") as "start" | "end";
      const textX = isRight ? xEnd + 4 : xEnd - 4;
      const textY = yEnd + 4;

      const availablePx = isRight ? vbW - textX - 6 : textX - 6;

      // Forzar salto si el label es largo
      const labelBroken = forceNewlineAfterLimit(s.data.label, 14);
      const raw = labelFormatter({
        label: labelBroken,
        value: s.data.value as number,
        pct: s.pct,
      });
      const lines = wrapAtMostTwoLines(raw, Math.max(0, availablePx), fontSpec);

      return {
        id: idx,
        color: s.data.color as string,
        path: `M ${p.x} ${p.y} L ${p2.x} ${p2.y} L ${xEnd} ${yEnd}`,
        textX,
        textY,
        textAnchor,
        lines,
      };
    });
  }, [segments, cx, cy, rOuter, leaderLineLen, vbW, labelFormatter, fontSpec]);

  return { segments, labels };
}
