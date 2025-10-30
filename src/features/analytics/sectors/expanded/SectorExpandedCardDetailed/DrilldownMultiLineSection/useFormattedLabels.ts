import type { Granularity } from "@/lib/types";
import { formatChartLabelsSimple } from "@/lib/utils/charts/labelFormatting";
import { useMemo } from "react";
import { MONTH_NAMES } from "./constants";

export function useFormattedLabels(
  xLabels: string[],
  granularity: Granularity
) {
  return useMemo(() => {
    const rawLabels = xLabels ?? [];

    // Formateo específico para granularidad anual
    if (granularity === "y") {
      // Para granularidad anual, convertir YYYY-MM a nombres de mes cortos
      return rawLabels.map((label) => {
        const dateStr = String(label);
        // Formato YYYY-MM
        if (/^\d{4}-\d{2}$/.test(dateStr)) {
          const month = parseInt(dateStr.split("-")[1]);
          return MONTH_NAMES[month - 1] || `M${month}`;
        }
        return dateStr; // Fallback
      });
    }

    // Para otras granularidades, usar la función original
    return formatChartLabelsSimple(rawLabels, granularity);
  }, [xLabels, granularity]);
}
