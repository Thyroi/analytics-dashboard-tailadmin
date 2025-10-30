import {
  BRAND_STOPS,
  generateBrandGradient,
} from "@/lib/utils/formatting/colors";
import { useMemo } from "react";
import type { DonutCardItem } from "./types";

export function useDonutColors(
  items: DonutCardItem[],
  isEmpty: boolean,
  theme: string | undefined,
  emptyLabel: string,
  emptyColor: string
) {
  // Color vacío adaptado al tema
  const adaptedEmptyColor = theme === "dark" ? "#374151" : emptyColor;

  // Paleta base (mínimo 6)
  const paletteBase = useMemo(() => {
    if (isEmpty) return undefined; // color fijo gris para el vacío
    const count = Math.max(6, items.length || 6);
    const p = generateBrandGradient(count, BRAND_STOPS);
    return p.length ? p : undefined;
  }, [items.length, isEmpty]);

  // Colores por label (respeta color si viene; en vacío usa gris)
  const colorsByLabel = useMemo(() => {
    if (isEmpty) return { [emptyLabel]: adaptedEmptyColor };
    const out: Record<string, string> = {};
    const fb = paletteBase ?? [];
    items.forEach((d, i) => {
      out[d.label] = d.color ?? fb[i % Math.max(1, fb.length)] ?? "#E55338";
    });
    return out;
  }, [isEmpty, items, paletteBase, emptyLabel, adaptedEmptyColor]);

  return {
    paletteBase,
    colorsByLabel,
  };
}
