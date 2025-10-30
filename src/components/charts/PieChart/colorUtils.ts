import {
  BRAND_STOPS,
  generateBrandGradient,
} from "@/lib/utils/formatting/colors";
import { useMemo } from "react";
import type { PieDatum } from "./types";

export function useChartColors(
  data: PieDatum[],
  palette?: string[],
  colorsByLabel?: Record<string, string>
) {
  const basePalette = useMemo(
    () => palette ?? generateBrandGradient(data.length, BRAND_STOPS),
    [palette, data.length]
  );

  const colors = useMemo(
    () =>
      data.map((d, i) => {
        const fixed = colorsByLabel?.[d.label];
        return fixed ?? basePalette[i % Math.max(1, basePalette.length)];
      }),
    [data, colorsByLabel, basePalette]
  );

  return colors;
}
