import { normalizeForMatch } from "@/lib/taxonomy/normalize";
import type { DonutDatum } from "@/lib/types";
import { useMemo } from "react";
import type {
  SubcategoryInsight,
  TownCategorySubcatDataResult,
  UseTownCategorySubcatDataParams,
} from "./TownCategorySubcatDrilldownView.types";
import { useTownCategorySubcatBucketing } from "./useTownCategorySubcatBucketing";

/**
 * Hook para transformar datos de subcategorías a formato ChartPair.
 * Incluye donut, series agrupadas, insights y totales.
 * Version town-first (root.<town>.<category>.<subcat>)
 */
export function useTownCategorySubcatData({
  data,
  categoryId,
  categoryRaw,
  windowGranularity,
}: UseTownCategorySubcatDataParams): TownCategorySubcatDataResult {
  const startDate = data?.meta?.range?.current?.start;
  const endDate = data?.meta?.range?.current?.end;

  const { bucketLabels, toBucketKey } = useTownCategorySubcatBucketing(
    startDate,
    endDate,
    windowGranularity
  );

  return useMemo(() => {
    const subcategories = data?.subcategories || [];

    if (subcategories.length === 0) {
      return {
        donutData: [] as DonutDatum[],
        totalInteractions: 0,
        insights: [] as SubcategoryInsight[],
        groupedCategories: [] as string[],
        groupedSeries: [],
      };
    }

    // Donut: subcategorías con interacciones
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

    // Insights: top 3 subcategorías
    const topSubcats: SubcategoryInsight[] = subcategories
      .slice(0, 3)
      .map((subcat) => ({
        label: subcat.subcategoryName,
        value: subcat.currentTotal,
        delta: subcat.deltaPercent,
      }));

    // Helper: parse raw maps (keys depth 4: root.<town>.<cat>.<subcat>)
    const parseRawToMap = (
      raw: Record<string, Array<{ time: string; value: number }>> | undefined
    ) => {
      const map = new Map<string, Record<string, number>>();
      if (!raw) return map;

      // Si tenemos el token raw de la categoría, usarlo; si no, usar el categoryId normalizado
      const categoryTokenToMatch = categoryRaw
        ? normalizeForMatch(categoryRaw)
        : normalizeForMatch(categoryId);

      for (const [key, series] of Object.entries(raw)) {
        const parts = key.split(".");
        if (parts.length !== 4 || parts[0] !== "root") continue;
        const cId = parts[2]; // parts[1] es town, parts[2] es categoria

        // Normalizar la categoría para comparación
        const normalizedCId = normalizeForMatch(cId);

        // El servicio ya filtró por town, solo verificamos categoría
        if (normalizedCId !== categoryTokenToMatch) continue;

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

    // Gather unique subcategory keys preserving original label
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
        const t = Object.values(cur as Record<string, number>).reduce(
          (a: number, b: number) => a + b,
          0
        );
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
    ];
    const colorsByName: Record<string, string> = {};
    topKeys.forEach((k, idx) => {
      colorsByName[k] = palette[idx % palette.length];
    });
    const otherColor = "#9CA3AF";

    // Build grouped series: current-only
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
  }, [data, categoryId, categoryRaw, bucketLabels, toBucketKey]);
}
