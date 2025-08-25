// src/features/chatbot/components/DailyStackedTop5.tsx
"use client";

import StackedBar from "@/components/charts/StackedBar";
import { buildStackedTop5, type SeriesByTag } from "@/lib/chatbot/stackTop5";

type Props = {
  seriesByTag: SeriesByTag;
  days?: number;
  height?: number;
  colorsByTag?: Record<string, string>;
  className?: string;
  title?: string;
  subtitle?: string;
};

export default function DailyStackedTop5({
  seriesByTag,
  days = 7,
  height = 260,
  colorsByTag,
  className = "",
  title = "Top-5 por día (últimos 7 días)",
  subtitle = "Barras apiladas por tag raíz",
}: Props) {
  const { dates, series } = buildStackedTop5(seriesByTag, days);

  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <div>
          <h3 className="card-title">{title}</h3>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      <div className="card-body">
        {dates.length === 0 ? (
          <div className="text-sm text-gray-400">Sin datos recientes.</div>
        ) : (
          <StackedBar
            categories={dates}
            series={series}
            height={height}
            colorsByName={colorsByTag}
          />
        )}
      </div>
    </div>
  );
}
