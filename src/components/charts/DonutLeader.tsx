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

  /** Texto */
  labelFontSize?: number;   // default: 11
  labelLineHeight?: number; // default: 13

  /** Margen opcional al viewBox (px) para dar aire a los lados */
  padViewBox?: number; // default: 0

  /** Callback opcional al hacer click en un sector (ignora "Otros") */
  onSliceClick?: (d: DonutDatum, meta: { index: number }) => void;
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

/* ---- Geometría ---- */
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

/* ---- Medición de texto ---- */
let __measureCanvas: HTMLCanvasElement | null = null;
function measureTextPx(text: string, font: string): number {
  if (typeof window === "undefined") return text.length * 6.2; // SSR aprox
  if (!__measureCanvas) __measureCanvas = document.createElement("canvas");
  const ctx = __measureCanvas.getContext("2d");
  if (!ctx) return text.length * 6.2;
  ctx.font = font;
  return ctx.measureText(text).width;
}

/** Fuerza un salto de línea en el siguiente espacio si el label supera `limit` */
function forceNewlineAfterLimit(label: string, limit = 14): string {
  if (label.length <= limit) return label;
  const i = label.indexOf(" ", limit);
  if (i === -1) return label; // no partir sin espacio
  return label.slice(0, i) + "\n" + label.slice(i + 1);
}

/**
 * Devuelve 1 o 2 líneas máximo. Respeta un salto forzado con '\n'.
 * Si ninguna partición por palabras encaja, deja 1 sola línea.
 */
function wrapAtMostTwoLines(
  text: string,
  maxWidthPx: number,
  font: string
): string[] {
  // Respeta salto forzado si llega
  if (text.includes("\n")) {
    const [l1, l2 = ""] = text.split("\n", 2);
    return l2 ? [l1, l2] : [l1];
  }

  if (measureTextPx(text, font) <= maxWidthPx) return [text];

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return [text];

  // Probar todos los puntos de corte
  let best: { i: number; maxW: number } | null = null;
  for (let i = 1; i < words.length; i++) {
    const l1 = words.slice(0, i).join(" ");
    const l2 = words.slice(i).join(" ");
    const w1 = measureTextPx(l1, font);
    const w2 = measureTextPx(l2, font);
    if (w1 <= maxWidthPx && w2 <= maxWidthPx) {
      const maxW = Math.max(w1, w2);
      if (!best || maxW < best.maxW) best = { i, maxW };
    }
  }
  if (best) {
    return [words.slice(0, best.i).join(" "), words.slice(best.i).join(" ")];
  }

  // Greedy
  let i = 1;
  while (i < words.length) {
    const l1 = words.slice(0, i + 1).join(" ");
    if (measureTextPx(l1, font) > maxWidthPx) break;
    i++;
  }
  if (i >= words.length) return [text];
  const l1 = words.slice(0, i).join(" ");
  const l2 = words.slice(i).join(" ");
  if (measureTextPx(l2, font) > maxWidthPx) return [text];
  return [l1, l2];
}

type _Item = DonutDatum & {
  color: string;
  __i?: number;           // índice original en data
  __isOthers?: boolean;   // marca si es el agregado "Otros"
  __others?: number[];    // índices incluidos en "Otros"
};

export default function DonutLeader({
  data,
  height = 280,
  innerRadiusRatio = 0.62,
  leaderLineLen = { radial: 16, horizontal: 22 },
  maxSlices = 6,
  labelFormatter = ({ label, pct }) => `${label} ${pct.toFixed(0)}%`,
  showCenterTotal = true,
  centerTitle = "Total",
  totalFormatter = (t) => Intl.NumberFormat().format(t),
  palette = DEFAULT_PALETTE,
  className = "",
  labelFontSize = 11,
  labelLineHeight = 13,
  padViewBox = 0,
  onSliceClick,
}: Props) {
  /* --------- Normalización / “Otros” --------- */
  const { items, total } = useMemo(() => {
    const series: _Item[] = data.map((d, i) => ({
      ...d,
      color: d.color ?? palette[i % palette.length],
      __i: i,
    }));
    const sum = series.reduce((a, b) => a + (b.value || 0), 0);
    if (series.length <= maxSlices) return { items: series, total: sum };

    const sorted = series.slice().sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, maxSlices - 1);
    const rest = sorted.slice(maxSlices - 1);
    const othersVal = rest.reduce((s, x) => s + x.value, 0);

    const others: _Item = {
      label: "Otros",
      value: othersVal,
      color: "#9CA3AF",
      __isOthers: true,
      __others: rest.map((x) => x.__i as number),
    };

    return { items: [...top, others], total: sum };
  }, [data, maxSlices, palette]);

  /* ----------------- Métricas del SVG ----------------- */
  const vbH = 300;
  const vbW = 300 + padViewBox * 2;
  const viewBox = `${-padViewBox} 0 ${vbW} ${vbH}`;

  const cx = vbW / 2;
  const cy = vbH / 2;
  const rOuter = 118;
  const rInner = rOuter * innerRadiusRatio;
  const gapRad = 0.006 * TAU;

  const fontSpec = `600 ${labelFontSize}px system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif`;

  /* ----------------- Segmentos ----------------- */
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

  /* ----------------- Labels (máx 2 líneas) ----------------- */
  const labels = segments.map((s, idx) => {
    const p = polarToXY(cx, cy, rOuter, s.mid);
    const p2 = polarToXY(cx, cy, rOuter + leaderLineLen.radial, s.mid);
    const isRight = Math.cos(s.mid) >= 0;

    const xEnd = p2.x + (isRight ? leaderLineLen.horizontal : -leaderLineLen.horizontal);
    const yEnd = p2.y;

    const textAnchor = (isRight ? "start" : "end") as "start" | "end";
    const textX = isRight ? xEnd + 4 : xEnd - 4;
    const textY = yEnd + 4;

    const availablePx = isRight ? vbW - textX - 6 : textX - 6;

    // Forzar salto si el label es largo
    const labelBroken = forceNewlineAfterLimit(s.data.label, 14);
    const raw = labelFormatter({ label: labelBroken, value: s.data.value as number, pct: s.pct });
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

  /* ----------------- Handlers ----------------- */
  const handleSliceClick = (item: _Item, index: number) => {
    if (!onSliceClick) return;
    if (item.__isOthers) return; // ignorar "Otros"
    onSliceClick({ label: item.label, value: item.value, color: item.color }, { index });
  };

  const isClickable = !!onSliceClick;

  /* ----------------- Render ----------------- */
  return (
    <div
      className={`w-full ${className}`}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
    >
      <svg
        viewBox={viewBox}
        width="100%"
        height="100%"
        role="img"
        overflow="visible"
        style={{ overflow: "visible" }}
      >
        {/* segmentos */}
        {segments.map((s, i) => {
          const clickable = isClickable && !s.data.__isOthers;
          return (
            <path
              key={`seg-${i}`}
              d={arcPath(cx, cy, rOuter, rInner, s.start, s.end)}
              fill={s.data.color}
              stroke="#fff"
              strokeWidth={3}
              style={{ cursor: clickable ? "pointer" : "default" }}
              onClick={clickable ? () => handleSliceClick(s.data, s.data.__i ?? i) : undefined}
              onKeyDown={
                clickable
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSliceClick(s.data, s.data.__i ?? i);
                      }
                    }
                  : undefined
              }
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              aria-label={clickable ? `${s.data.label}: ${Math.round(s.pct)}%` : undefined}
            />
          );
        })}

        {/* guías */}
        {labels.map((l) => (
          <path key={`lead-${l.id}`} d={l.path} fill="none" stroke={l.color} strokeWidth={1.5} />
        ))}

        {/* textos */}
        {labels.map((l) => (
          <text
            key={`txt-${l.id}`}
            x={l.textX}
            y={l.textY}
            fontSize={labelFontSize}
            fontWeight={600}
            textAnchor={l.textAnchor}
            fill="#111827"
          >
            {l.lines.map((ln, i) => (
              <tspan key={i} x={l.textX} dy={i === 0 ? 0 : labelLineHeight}>
                {ln}
              </tspan>
            ))}
          </text>
        ))}

        {/* centro */}
        {showCenterTotal && (
          <>
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize={16} fill="#6b7280">
              {centerTitle}
            </text>
            <text x={cx} y={cy + 18} textAnchor="middle" fontSize={22} fontWeight={800} fill="#111827">
              {totalFormatter(total)}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

