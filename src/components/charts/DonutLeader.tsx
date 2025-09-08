"use client";

import React, { useMemo } from "react";

export type DonutDatum = {
  label: string;
  value: number;
  color?: string;
};

type Props = {
  data: DonutDatum[];
  /** Altura del gráfico (px o "100%"). */
  height?: number | string;
  innerRadiusRatio?: number;
  leaderLineLen?: { radial: number; horizontal: number };
  maxSlices?: number;
  labelFormatter?: (d: { label: string; value: number; pct: number }) => string;
  showCenterTotal?: boolean;
  centerTitle?: string;
  totalFormatter?: (total: number) => string;
  palette?: readonly string[];
  className?: string;
};

const DEFAULT_PALETTE = [
  "#3B82F6",
  "#22C55E",
  "#F59E0B",
  "#A855F7",
  "#EF4444",
  "#10B981",
  "#60A5FA",
  "#F472B6",
] as const;

const TAU = Math.PI * 2;

function polarToXY(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function arcPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  start: number,
  end: number
): string {
  const largeArc = end - start > Math.PI ? 1 : 0;
  const p0 = polarToXY(cx, cy, rOuter, start);
  const p1 = polarToXY(cx, cy, rOuter, end);
  const q1 = polarToXY(cx, cy, rInner, end);
  const q0 = polarToXY(cx, cy, rInner, start);

  return [
    `M ${p0.x} ${p0.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p1.x} ${p1.y}`,
    `L ${q1.x} ${q1.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${q0.x} ${q0.y}`,
    "Z",
  ].join(" ");
}

export default function DonutLeader({
  data,
  height = 280,
  innerRadiusRatio = 0.62,
  leaderLineLen = { radial: 16, horizontal: 22 },
  maxSlices = 6,
  labelFormatter = ({ label, pct }) => `${label}  ${pct.toFixed(0)}%`,
  showCenterTotal = true,
  centerTitle = "Total",
  totalFormatter = (t) => Intl.NumberFormat().format(t),
  palette = DEFAULT_PALETTE,
  className = "",
}: Props) {
  const { items, total } = useMemo(() => {
    const series = data.map((d, i) => ({
      ...d,
      color: d.color ?? palette[i % palette.length],
    }));
    const sum = series.reduce((a, b) => a + (b.value || 0), 0);
    if (series.length <= maxSlices) return { items: series, total: sum };

    const top = series
      .slice()
      .sort((a, b) => b.value - a.value)
      .slice(0, maxSlices - 1);
    const rest = series
      .slice()
      .sort((a, b) => b.value - a.value)
      .slice(maxSlices - 1);
    const othersVal = rest.reduce((s, x) => s + x.value, 0);
    return {
      items: [...top, { label: "Otros", value: othersVal, color: "#9CA3AF" }],
      total: sum,
    };
  }, [data, maxSlices, palette]);

  const vb = 300;
  const cx = vb / 2;
  const cy = vb / 2;
  const rOuter = 118;
  const rInner = rOuter * innerRadiusRatio;
  const gapRad = 0.006 * TAU;

  const segments = useMemo(() => {
    let acc = 0;
    return items.map((d) => {
      const frac = total > 0 ? d.value / total : 0;
      const start = acc;
      const end = acc + Math.max(frac * TAU - gapRad, 0);
      acc += frac * TAU;
      const mid = (start + end) / 2;
      const pct = total > 0 ? (d.value / total) * 100 : 0;
      return { ...d, start, end, mid, pct };
    });
  }, [items, total, gapRad]);

  const labels = segments.map((s, idx) => {
    const p = polarToXY(cx, cy, rOuter, s.mid);
    const p2 = polarToXY(cx, cy, rOuter + leaderLineLen.radial, s.mid);
    const isRight = Math.cos(s.mid) >= 0;
    const xEnd = p2.x + (isRight ? leaderLineLen.horizontal : -leaderLineLen.horizontal);
    const yEnd = p2.y;

    const textAnchor = isRight ? "start" : "end";
    const textX = isRight ? xEnd + 4 : xEnd - 4;
    const textY = yEnd + 4;

    return {
      id: idx,
      color: s.color as string,
      path: `M ${p.x} ${p.y} L ${p2.x} ${p2.y} L ${xEnd} ${yEnd}`,
      text: labelFormatter({ label: s.label, value: s.value, pct: s.pct }),
      textX,
      textY,
      textAnchor,
    };
  });

  return (
    <div
      className={`w-full ${className}`}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
    >
      <svg viewBox={`0 0 ${vb} ${vb}`} width="100%" height="100%" role="img">
        {segments.map((s, i) => (
          <path
            key={`seg-${i}`}
            d={arcPath(cx, cy, rOuter, rInner, s.start, s.end)}
            fill={s.color}
            stroke="#fff"
            strokeWidth={3}
          />
        ))}

        {labels.map((l) => (
          <path
            key={`lead-${l.id}`}
            d={l.path}
            fill="none"
            stroke={l.color}
            strokeWidth={1.5}
          />
        ))}

        {labels.map((l) => (
          <text
            key={`txt-${l.id}`}
            x={l.textX}
            y={l.textY}
            fontSize={11}
            fontWeight={600}
            textAnchor={l.textAnchor as "start" | "middle" | "end"}
            fill="#111827"
          >
            {l.text}
          </text>
        ))}

        {showCenterTotal && (
          <>
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize={16} fill="#6b7280">
              {centerTitle}
            </text>
            <text
              x={cx}
              y={cy + 18}
              textAnchor="middle"
              fontSize={22}
              fontWeight={800}
              fill="#111827"
            >
              {totalFormatter(total)}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
