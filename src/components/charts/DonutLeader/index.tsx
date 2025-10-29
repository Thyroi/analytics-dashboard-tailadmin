"use client";

import { arcPath, TAU } from "./donutGeometry";
import type { DonutItem, DonutLeaderProps } from "./DonutLeader.types";
import { DEFAULT_PALETTE } from "./DonutLeader.types";
import { useDonutData } from "./useDonutData";
import { useDonutSegments } from "./useDonutSegments";

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
}: DonutLeaderProps) {
  /* --------- Normalización / "Otros" --------- */
  const { items, total } = useDonutData({ data, maxSlices, palette });

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

  /* ----------------- Segmentos y Labels ----------------- */
  const { segments, labels } = useDonutSegments({
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
  });

  /* ----------------- Handlers ----------------- */
  const handleSliceClick = (item: DonutItem, index: number) => {
    if (!onSliceClick) return;
    // Permitir navegación en "Otros" - ya no bloqueamos el click
    onSliceClick(
      { label: item.label, value: item.value, color: item.color },
      { index }
    );
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
          const clickable = isClickable; // Todos los slices son clickables, incluido "Otros"
          return (
            <path
              key={`seg-${i}`}
              d={arcPath(cx, cy, rOuter, rInner, s.start, s.end)}
              fill={s.data.color}
              stroke="#fff"
              strokeWidth={3}
              style={{ cursor: clickable ? "pointer" : "default" }}
              onClick={
                clickable
                  ? () => handleSliceClick(s.data, s.data.__i ?? i)
                  : undefined
              }
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
              aria-label={
                clickable ? `${s.data.label}: ${Math.round(s.pct)}%` : undefined
              }
            />
          );
        })}

        {/* guías */}
        {labels.map((l) => (
          <path
            key={`lead-${l.id}`}
            d={l.path}
            fill="none"
            stroke={l.color}
            strokeWidth={1.5}
          />
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
            <text
              x={cx}
              y={cy - 6}
              textAnchor="middle"
              fontSize={16}
              fill="#6b7280"
            >
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

// Re-export type for convenience
export type { DonutDatum } from "./DonutLeader.types";
