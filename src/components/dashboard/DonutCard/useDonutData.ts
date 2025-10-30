import { useMemo } from "react";
import type { DonutCardItem } from "./types";

export function useDonutData(
  items: DonutCardItem[],
  centerValueOverride?: number,
  emptyLabel = "No se han encontrado datos"
) {
  const sum = useMemo(
    () =>
      items.reduce(
        (acc, it) => acc + (Number.isFinite(it.value) ? it.value : 0),
        0
      ),
    [items]
  );

  const isEmpty = items.length === 0 || sum <= 0;

  const centerValue = useMemo(() => {
    if (isEmpty) return 0;
    if (typeof centerValueOverride === "number") return centerValueOverride;
    return sum;
  }, [isEmpty, sum, centerValueOverride]);

  // Datos para Apex (si está vacío, un único slice al 100%)
  const apexData = useMemo(() => {
    if (isEmpty) return [{ label: emptyLabel, value: 1 }];
    return items.map((d) => ({ label: d.label, value: d.value }));
  }, [isEmpty, items, emptyLabel]);

  // Calcular columnas automáticamente si no se especifica
  const autoColumns = (legendColumns?: 1 | 2) => {
    if (legendColumns !== undefined) return legendColumns;
    // Si hay más de 5 items, usar 2 columnas; si no, 1 columna
    return items.length > 5 ? 2 : 1;
  };

  return {
    sum,
    isEmpty,
    centerValue,
    apexData,
    autoColumns,
  };
}
