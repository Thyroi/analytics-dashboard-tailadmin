import type { WindowGranularity } from "@/lib/types";
import { addDaysUTC, parseISO, toISO } from "@/lib/utils/time/datetime";
import { useMemo } from "react";

interface BucketingResult {
  bucketLabels: string[];
  toBucketKey: (isoDate: string) => string;
}

/**
 * Hook para calcular bucketing temporal (días, semanas o meses)
 * basado en el rango de fechas y granularidad global.
 */
export function useTownCategorySubcatBucketing(
  startDate: string | undefined,
  endDate: string | undefined,
  windowGranularity: WindowGranularity,
): BucketingResult {
  return useMemo(() => {
    // Build date categories from range (inclusive)
    const dates: string[] = [];
    if (startDate && endDate) {
      let d = parseISO(startDate);
      const e = parseISO(endDate);
      while (d <= e) {
        dates.push(toISO(d));
        d = addDaysUTC(d, 1);
      }
    }

    // Decide bucketization to cap to ~30 buckets
    let bucketMode: "d" | "w" | "m" =
      dates.length > 120 ? "m" : dates.length > 45 ? "w" : "d";
    if (windowGranularity === "m") {
      bucketMode = "w"; // Override: para granularidad mensual, usar buckets semanales
    }
    if (windowGranularity === "y") {
      bucketMode = "m"; // Para año, agrupar por meses (12 buckets)
    }

    const toBucketKey = (isoDate: string) => {
      if (bucketMode === "d") return isoDate;
      const [y, m, d] = isoDate.split("-").map((x) => parseInt(x, 10));
      const date = new Date(y, m - 1, d);
      if (bucketMode === "m") {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0",
        )}`;
      }
      // week bucket (ISO week-ish label - Monday of week)
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

    return { bucketLabels, toBucketKey };
  }, [startDate, endDate, windowGranularity]);
}
