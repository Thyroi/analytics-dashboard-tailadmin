import type { WindowGranularity } from "@/lib/types";
import { useMemo } from "react";

interface BucketingResult {
  bucketLabels: string[];
  toBucketKey: (isoDate: string) => string;
}

/**
 * Hook para calcular bucketing temporal (días, semanas o meses)
 * basado en el rango de fechas y granularidad global.
 */
export function useCategoryTownSubcatBucketing(
  startDate: string | undefined,
  endDate: string | undefined,
  granularity: WindowGranularity
): BucketingResult {
  return useMemo(() => {
    // Build date categories from range (inclusive)
    const dates: string[] = [];
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        dates.push(`${yyyy}-${mm}-${dd}`);
      }
    }

    // Decide bucketization to cap to ~30 buckets
    let bucketMode: "d" | "w" | "m" =
      dates.length > 120 ? "m" : dates.length > 45 ? "w" : "d";
    if (granularity === "m") {
      bucketMode = "w"; // Override: para granularidad mensual, usar buckets semanales
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
      // week bucket (label by week start date - Monday)
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
  }, [startDate, endDate, granularity]);
}
