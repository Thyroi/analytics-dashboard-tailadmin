import type { GroupedBarSeries } from "@/components/charts/GroupedBarChart";
import type { DonutDatum } from "@/lib/types";
import { useMemo } from "react";
import type {
  CategoryOthersDataResult,
  UseCategoryOthersDataParams,
} from "./CategoryOthersBreakdownView.types";

/**
 * Hook para transformar othersBreakdown a formato ChartPair.
 * Agrupa por leaf (último token), genera donut y series temporales con bucketización.
 */
export function useCategoryOthersData({
  othersBreakdown,
  granularity,
}: UseCategoryOthersDataParams): CategoryOthersDataResult {
  return useMemo(() => {
    const byLeaf = new Map<
      string,
      { total: number; timePoints: Map<string, number> }
    >();

    // Agrupar por leaf (último token) con puntos temporales
    for (const entry of othersBreakdown) {
      const leaf = entry.path[entry.path.length - 1] || "desconocido";

      if (!byLeaf.has(leaf)) {
        byLeaf.set(leaf, { total: 0, timePoints: new Map() });
      }

      const leafData = byLeaf.get(leaf)!;
      leafData.total += entry.value;

      // Agregar puntos temporales
      for (const point of entry.timePoints) {
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

    // Generar donut data
    const donutData: DonutDatum[] = Array.from(byLeaf.entries())
      .map(([leaf, data]) => ({
        label: leaf.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()),
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

    // Bucketización según granularidad
    let bucketMode: "d" | "w" | "m" =
      dates.length > 120 ? "m" : dates.length > 45 ? "w" : "d";
    if (granularity === "m") {
      bucketMode = "w";
    }
    if (granularity === "y") {
      bucketMode = "m"; // Para año, agrupar por meses
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

    // Construir series agrupadas
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
}
