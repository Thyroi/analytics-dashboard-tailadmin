/**
 * Componente para Nivel 2: Categoría + Town → Subcategorías
 *
 * Muestra el drilldown de subcategorías para una categoría+town específico
 * usando pattern root.<categoriaRaw>.<townRaw>.*
 */

"use client";

import ChartPair from "@/components/common/ChartPair";
import { CATEGORY_META, type CategoryId } from "@/lib/taxonomy/categories";
import { TOWN_META, type TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, WindowGranularity } from "@/lib/types";
import { useMemo } from "react";
import { useCategoryTownSubcatBreakdown } from "../hooks/useCategoryTownSubcatBreakdown";

type Props = {
  categoryId: CategoryId;
  townId: TownId;
  categoryRaw?: string | null; // Token raw de la categoría desde nivel 1
  townRaw?: string | null; // Token raw del pueblo desde nivel 1
  granularity: WindowGranularity;
  startDate?: string | null;
  endDate?: string | null;
  onBack: () => void;
  onSubcategoryClick?: (subcategory: string) => void;
};

export default function CategoryTownSubcatDrilldownView({
  categoryId,
  townId,
  categoryRaw,
  townRaw,
  granularity,
  startDate,
  endDate,
  onBack,
  onSubcategoryClick,
}: Props) {
  const categoryLabel = CATEGORY_META[categoryId]?.label || categoryId;
  const townLabel = TOWN_META[townId]?.label || townId;

  // Fetch data usando el hook de nivel 2
  const { data, isLoading, isError, error } = useCategoryTownSubcatBreakdown({
    categoryId,
    townId,
    representativeCategoryRaw: categoryRaw,
    representativeTownRaw: townRaw,
    startISO: startDate,
    endISO: endDate,
    windowGranularity: granularity,
    enabled: true,
  });

  // Transformar datos a formato ChartPair (agrupado por fechas)
  const {
    donutData,
    totalInteractions,
    insights,
    groupedCategories,
    groupedSeries,
  } = useMemo(() => {
    const subcategories = data?.subcategories || [];

    if (subcategories.length === 0) {
      return {
        donutData: [] as DonutDatum[],
        totalInteractions: 0,
        insights: [],
        groupedCategories: [] as string[],
        groupedSeries: [] as Array<{
          name: string;
          data: number[];
          color?: string;
        }>,
      };
    }

    // Donut: subcategorías
    const donut: DonutDatum[] = subcategories
      .filter((subcat) => subcat.currentTotal > 0)
      .map((subcat) => ({
        label: subcat.subcategoryName,
        value: subcat.currentTotal,
        color: undefined,
      }));

    const total = subcategories.reduce(
      (sum, subcat) => sum + subcat.currentTotal,
      0
    );

    // Insights: top subcategorías
    const topSubcats = subcategories.slice(0, 3).map((subcat) => ({
      label: subcat.subcategoryName,
      value: subcat.currentTotal,
      delta: subcat.deltaPercent,
    }));

    // Build date categories from meta.range.current (inclusive)
    const start = data?.meta?.range?.current?.start;
    const end = data?.meta?.range?.current?.end;
    const dates: string[] = [];
    if (start && end) {
      const s = new Date(start);
      const e = new Date(end);
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        dates.push(`${yyyy}-${mm}-${dd}`);
      }
    }

    // Decide bucketization to cap to ~30 buckets
    // Override: if global granularity is monthly, we want weekly buckets only for this chart.
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
      // week bucket (label by week start date)
      const day = date.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      const monday = new Date(date);
      monday.setDate(date.getDate() + diffToMonday);
      const wy = monday.getFullYear();
      const wMonth = String(monday.getMonth() + 1).padStart(2, "0");
      const wDay = String(monday.getDate()).padStart(2, "0");
      return `${wy}-W${wMonth}${wDay}`;
    };

    // Ordered bucket labels
    const bucketLabels: string[] = [];
    const seen = new Set<string>();
    for (const d of dates) {
      const key = toBucketKey(d);
      if (!seen.has(key)) {
        seen.add(key);
        bucketLabels.push(key);
      }
    }

    // Helper: parse raw maps from data.raw (keys depth 4: root.<category>.<town>.<subcat>)
    const parseRawToMap = (
      raw: Record<string, Array<{ time: string; value: number }>> | undefined
    ) => {
      const map = new Map<string, Record<string, number>>();
      if (!raw) return map;

      // Normalizar función: eliminar acentos y convertir a lowercase
      const normalize = (s: string) =>
        s
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim();

      // Obtener el token de categoría esperado
      const { token: categoryToken } = CATEGORY_META[categoryId]
        ? { token: CATEGORY_META[categoryId].label.toLowerCase() }
        : { token: categoryId.toLowerCase() };

      const normalizedCategoryToken = normalize(categoryToken);
      const normalizedTownId = normalize(townId);

      // Si tenemos el token raw del pueblo, usarlo; si no, usar el townId normalizado
      const townTokenToMatch = townRaw ? normalize(townRaw) : normalizedTownId;

      for (const [key, series] of Object.entries(raw)) {
        const parts = key.split(".");
        if (parts.length !== 4) continue;
        if (parts[0] !== "root") continue;
        const cId = parts[1];
        const tId = parts[2];

        // Normalizar para comparación
        const normalizedCId = normalize(cId);
        const normalizedTId = normalize(tId);

        // Ensure matches this category/town ordering (con normalización)
        if (normalizedCId !== normalizedCategoryToken) continue;
        if (normalizedTId !== townTokenToMatch) continue;

        const rawSub = parts[3];
        if (!rawSub) continue;
        const sub = rawSub.trim().toLowerCase();
        const dateMap: Record<string, number> = map.get(sub) || {};
        for (const p of series) {
          const dIso = `${p.time.slice(0, 4)}-${p.time.slice(
            4,
            6
          )}-${p.time.slice(6, 8)}`;
          const bucket = toBucketKey(dIso);
          dateMap[bucket] = (dateMap[bucket] || 0) + p.value;
        }
        map.set(sub, dateMap);
      }

      return map;
    };

    const rawCurrentMap = parseRawToMap(data?.raw?.current);

    // Gather unique subcategory keys (normalized) preserving original label from subcategories
    const nameMap = new Map<string, string>();
    for (const s of subcategories) {
      nameMap.set(s.subcategoryName.toLowerCase(), s.subcategoryName);
    }

    const subKeys = Array.from(
      new Set([...rawCurrentMap.keys(), ...Array.from(nameMap.keys())])
    );

    // Limit to top-K subcategories
    const totalBySub: Array<{ key: string; total: number }> = subKeys.map(
      (k) => {
        const cur = rawCurrentMap.get(k) || {};
        const t = Object.values(cur).reduce((a, b) => a + b, 0);
        return { key: k, total: t };
      }
    );
    totalBySub.sort((a, b) => b.total - a.total);
    const K = 6;
    const topKeys = totalBySub.slice(0, K).map((t) => t.key);
    const otherKeys = totalBySub.slice(K).map((t) => t.key);

    // Colors: map each subkey to a stable color
    const palette = [
      "#3B82F6",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#06B6D4",
    ]; // 6 colors
    const colorsByName: Record<string, string> = {};
    topKeys.forEach((k, idx) => {
      colorsByName[k] = palette[idx % palette.length];
    });
    const otherColor = "#9CA3AF";

    // Build grouped series: current-only per latest requirement
    const groupedSeries: Array<{
      name: string;
      data: number[];
      color?: string;
    }> = [];
    for (const k of topKeys) {
      const label = nameMap.get(k) || k;
      const curMap = rawCurrentMap.get(k) || {};
      const curData = bucketLabels.map((b) => curMap[b] || 0);
      const color = colorsByName[k];
      groupedSeries.push({ name: label, data: curData, color });
    }
    if (otherKeys.length > 0) {
      const curAgg: Record<string, number> = {};
      for (const k of otherKeys) {
        const curMap = rawCurrentMap.get(k) || {};
        for (const b of bucketLabels) {
          curAgg[b] = (curAgg[b] || 0) + (curMap[b] || 0);
        }
      }
      const curData = bucketLabels.map((b) => curAgg[b] || 0);
      groupedSeries.push({ name: `Otros`, data: curData, color: otherColor });
    }

    return {
      donutData: donut,
      totalInteractions: total,
      insights: topSubcats,
      groupedCategories: bucketLabels,
      groupedSeries,
    };
  }, [data, categoryId, townId, townRaw, granularity]);

  const handleDonutSlice = (label: string) => {
    onSubcategoryClick?.(label);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {categoryLabel} › {townLabel}
          </h3>
          <button
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            ← Volver
          </button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">
            Error al cargar subcategorías
          </h3>
          <button
            onClick={onBack}
            className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            ← Volver
          </button>
        </div>
        <p className="text-red-600 dark:text-red-300 text-sm">
          {error?.message || "Error desconocido"}
        </p>
      </div>
    );
  }

  if (totalInteractions === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {categoryLabel} › {townLabel}
          </h3>
          <button
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            ← Volver
          </button>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400 mb-2">
            No hay subcategorías disponibles
          </div>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            No se encontraron datos para este período
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {categoryLabel} › {townLabel}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Subcategorías • {totalInteractions.toLocaleString()} interacciones
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center gap-1"
        >
          <svg
            className="w-4 h-4"
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
          Volver
        </button>
      </div>

      <ChartPair
        mode="grouped"
        categories={groupedCategories}
        groupedSeries={groupedSeries}
        chartTitle="Subcategorías por intervalo"
        chartSubtitle={`${categoryLabel} • ${townLabel} • ${groupedCategories.length} intervalos`}
        chartHeight={350}
        tooltipFormatter={(val) => val.toLocaleString()}
        yAxisFormatter={(val) => val.toLocaleString()}
        donutData={donutData}
        deltaPct={null}
        onDonutSlice={handleDonutSlice}
        donutCenterLabel={townLabel}
        showActivityButton={false}
        granularity={granularity}
        legendPosition="bottom"
        className=""
      />

      {/* Insights de subcategorías top */}
      {insights.length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {insights.map((insight, index) => (
            <div
              key={`${insight.label}-${index}-${insight.value}`}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
            >
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                #{index + 1} Subcategoría
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                {insight.label}
              </div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {insight.value.toLocaleString()}
              </div>
              {insight.delta !== null && (
                <div
                  className={`text-xs ${
                    insight.delta > 0
                      ? "text-green-600"
                      : insight.delta < 0
                      ? "text-red-600"
                      : "text-gray-500"
                  }`}
                >
                  {insight.delta > 0 ? "+" : ""}
                  {insight.delta.toFixed(1)}%
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// (no previous series)
