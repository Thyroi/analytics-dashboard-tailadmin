/**
 * Vista de nivel 2 para "Otros" (claves que no mapearon a pueblo)
 *
 * Muestra desglose por leaf (último token) de todas las claves no mapeadas
 * Ejemplo: root.patrimonio.tejada.ermita → leaf = "ermita"
 */

"use client";

import type { GroupedBarSeries } from "@/components/charts/GroupedBarChart";
import ChartPair from "@/components/common/ChartPair";
import type { OthersBreakdownEntry } from "@/lib/services/chatbot/categoryTownBreakdown";
import type { CategoryId } from "@/lib/taxonomy/categories";
import { CATEGORY_META } from "@/lib/taxonomy/categories";
import type { DonutDatum, WindowGranularity } from "@/lib/types";
import { useMemo } from "react";

type Props = {
  categoryId: CategoryId;
  othersBreakdown: OthersBreakdownEntry[];
  granularity: WindowGranularity;
  startDate?: string | null;
  endDate?: string | null;
  onBack?: () => void;
};

export default function CategoryOthersBreakdownView({
  categoryId,
  othersBreakdown,
  granularity,
  onBack,
}: Props) {
  const categoryLabel = CATEGORY_META[categoryId]?.label || categoryId;

  // Agrupar por leaf (último token) y generar donut + series para GroupedBarChart
  const { donutData, totalInteractions, categories, groupedSeries } =
    useMemo(() => {
      const byLeaf = new Map<
        string,
        { total: number; timePoints: Map<string, number> }
      >();

      // Agrupar por leaf con puntos temporales
      for (const entry of othersBreakdown) {
        // Extraer leaf (último token)
        const leaf = entry.path[entry.path.length - 1] || "desconocido";

        if (!byLeaf.has(leaf)) {
          byLeaf.set(leaf, { total: 0, timePoints: new Map() });
        }

        const leafData = byLeaf.get(leaf)!;
        leafData.total += entry.value;

        // Agregar puntos temporales
        for (const point of entry.timePoints) {
          // Convertir YYYYMMDD a YYYY-MM-DD
          const timeStr = point.time;
          const iso =
            timeStr.length === 8
              ? `${timeStr.slice(0, 4)}-${timeStr.slice(4, 6)}-${timeStr.slice(
                  6,
                  8
                )}`
              : timeStr;

          const prev = leafData.timePoints.get(iso) || 0;
          leafData.timePoints.set(iso, prev + (point.value || 0));
        }
      }

      // Convertir a donut data
      const donutData: DonutDatum[] = Array.from(byLeaf.entries())
        .map(([leaf, data]) => ({
          label: leaf
            .replace(/_/g, " ")
            .replace(/\b\w/g, (m) => m.toUpperCase()),
          value: data.total,
        }))
        .sort((a, b) => b.value - a.value);

      const totalInteractions = donutData.reduce(
        (sum, item) => sum + item.value,
        0
      );

      // Recopilar todas las fechas únicas
      const allDates = new Set<string>();
      for (const [, data] of byLeaf) {
        for (const [iso] of data.timePoints) {
          allDates.add(iso);
        }
      }

      // Ordenar fechas
      const dates = Array.from(allDates).sort((a, b) => a.localeCompare(b));

      // Aplicar lógica de bucketización según granularidad
      let bucketMode: "d" | "w" | "m" =
        dates.length > 120 ? "m" : dates.length > 45 ? "w" : "d";
      if (granularity === "m") {
        bucketMode = "w";
      }
      if (granularity === "y") {
        bucketMode = "m"; // Para año, agrupar por meses (12 buckets)
      }

      const toBucketKey = (isoDate: string) => {
        if (bucketMode === "d") return isoDate;
        const [y, m, d] = isoDate.split("-").map((x) => parseInt(x, 10));
        const date = new Date(y, m - 1, d);
        if (bucketMode === "m") {
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}`;
        }
        // week bucket
        const day = date.getDay();
        const diffToMonday = (day === 0 ? -6 : 1) - day;
        const monday = new Date(date);
        monday.setDate(date.getDate() + diffToMonday);
        const wy = monday.getFullYear();
        const wMonth = String(monday.getMonth() + 1).padStart(2, "0");
        const wDay = String(monday.getDate()).padStart(2, "0");
        return `${wy}-W${wMonth}${wDay}`;
      };

      // Generar buckets ordenados
      const bucketLabels: string[] = [];
      const seen = new Set<string>();
      for (const d of dates) {
        const key = toBucketKey(d);
        if (!seen.has(key)) {
          seen.add(key);
          bucketLabels.push(key);
        }
      }

      // Aplicar bucketización a cada leaf
      const bucketizedByLeaf = new Map<string, Record<string, number>>();
      for (const [leaf, data] of byLeaf) {
        const bucketMap: Record<string, number> = {};
        for (const [iso, value] of data.timePoints) {
          const bucket = toBucketKey(iso);
          bucketMap[bucket] = (bucketMap[bucket] || 0) + value;
        }
        bucketizedByLeaf.set(leaf, bucketMap);
      }

      // Limitar a top K (6) + "Otros"
      const totalBySub = Array.from(byLeaf.entries())
        .map(([leaf, data]) => ({ key: leaf, total: data.total }))
        .sort((a, b) => b.total - a.total);

      const K = 6;
      const topKeys = totalBySub.slice(0, K).map((t) => t.key);
      const otherKeys = totalBySub.slice(K).map((t) => t.key);

      // Paleta de colores
      const palette = [
        "#3B82F6",
        "#10B981",
        "#F59E0B",
        "#EF4444",
        "#8B5CF6",
        "#06B6D4",
      ];
      const otherColor = "#9CA3AF";

      // Construir series agrupadas: una serie por cada leaf (top K)
      const groupedSeries: GroupedBarSeries[] = [];

      for (let i = 0; i < topKeys.length; i++) {
        const leaf = topKeys[i];
        const label = leaf
          .replace(/_/g, " ")
          .replace(/\b\w/g, (m) => m.toUpperCase());
        const bucketMap = bucketizedByLeaf.get(leaf) || {};
        const data = bucketLabels.map((b) => bucketMap[b] || 0);
        const color = palette[i % palette.length];
        groupedSeries.push({ name: label, data, color });
      }

      // Agregar "Otros" si hay más leafs
      if (otherKeys.length > 0) {
        const othersAgg: Record<string, number> = {};
        for (const leaf of otherKeys) {
          const bucketMap = bucketizedByLeaf.get(leaf) || {};
          for (const b of bucketLabels) {
            othersAgg[b] = (othersAgg[b] || 0) + (bucketMap[b] || 0);
          }
        }
        const data = bucketLabels.map((b) => othersAgg[b] || 0);
        groupedSeries.push({ name: "Otros", data, color: otherColor });
      }

      return {
        donutData,
        totalInteractions,
        categories: bucketLabels,
        groupedSeries,
      };
    }, [othersBreakdown, granularity]);

  if (othersBreakdown.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {categoryLabel} → Otros
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No hay datos de claves sin mapear
            </p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Volver"
            >
              <svg
                className="w-5 h-5 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Volver"
            >
              <svg
                className="w-5 h-5 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {categoryLabel} → Otros
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Análisis por subtemas • {totalInteractions.toLocaleString()}{" "}
              interacciones totales
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <ChartPair
        mode="grouped"
        categories={categories}
        groupedSeries={groupedSeries}
        chartTitle="Serie temporal"
        chartSubtitle={`${totalInteractions.toLocaleString()} interacciones totales`}
        donutData={donutData}
        deltaPct={null}
        donutCenterLabel="Otros"
        showActivityButton={false}
        granularity={granularity}
        tooltipFormatter={(val) => (val ?? 0).toLocaleString()}
        yAxisFormatter={(val) => (val ?? 0).toString()}
        legendPosition="bottom"
        className=""
      />
    </div>
  );
}
