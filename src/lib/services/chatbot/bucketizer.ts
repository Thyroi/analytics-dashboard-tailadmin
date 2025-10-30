/**
 * Bucketización de time-series según granularidad
 *
 * Convierte registros diarios (YYYYMMDD) a buckets según granularidad:
 * - "d": YYYY-MM-DD (diario)
 * - "m": YYYY-MM (mensual)
 * - "y": YYYY (anual, pero para un año completo se divide en 12 meses)
 *
 * IMPORTANTE:
 * - Rellena con 0 los buckets sin datos
 * - Deriva previousRange automáticamente (misma longitud que current, ventana contigua anterior)
 * - Garantiza que current y previous tengan el mismo número de buckets
 */

import type { WindowGranularity } from "@/lib/types";
import { addDaysUTC, parseISO, toISO } from "@/lib/utils/time/datetime";
import type { UniverseRecord } from "./universeCollector";

/* ==================== Tipos ==================== */

export type BucketizedData = {
  /** Etiquetas de los buckets (YYYY-MM-DD | YYYY-MM | YYYY) */
  xLabels: string[];

  /** Valores agregados por bucket para el rango actual */
  current: number[];

  /** Valores agregados por bucket para el rango anterior (misma longitud) */
  previous: number[];

  /** Metadatos */
  meta: {
    granularity: WindowGranularity;
    currentRange: { start: string; end: string };
    previousRange: { start: string; end: string };
    totalBuckets: number;
  };
};

/* ==================== Helpers ==================== */

/**
 * Convierte tiempo YYYYMMDD a formato ISO YYYY-MM-DD
 */
function timeToISO(time: string): string {
  if (time.length !== 8) return time;
  return `${time.slice(0, 4)}-${time.slice(4, 6)}-${time.slice(6, 8)}`;
}

/**
 * Convierte tiempo YYYYMMDD a bucket según granularidad
 */
function timeToBucket(time: string, granularity: WindowGranularity): string {
  const iso = timeToISO(time);

  switch (granularity) {
    case "d":
      return iso; // YYYY-MM-DD
    case "m":
      return iso.slice(0, 7); // YYYY-MM
    case "y":
      return iso.slice(0, 7); // YYYY-MM (agrupa por mes en vista anual)
    default:
      return iso;
  }
}

/**
 * Genera lista de buckets para un rango dado
 */
function generateBuckets(
  startISO: string,
  endISO: string,
  granularity: WindowGranularity
): string[] {
  const buckets: string[] = [];
  const start = parseISO(startISO);
  const end = parseISO(endISO);

  if (granularity === "d") {
    // Diario: un bucket por día
    for (
      let d = new Date(start.getTime());
      d.getTime() <= end.getTime();
      d = addDaysUTC(d, 1)
    ) {
      buckets.push(toISO(d));
    }
  } else if (granularity === "m") {
    // Mensual: un bucket por mes
    const startYear = start.getUTCFullYear();
    const startMonth = start.getUTCMonth();
    const endYear = end.getUTCFullYear();
    const endMonth = end.getUTCMonth();

    for (let y = startYear; y <= endYear; y++) {
      const monthStart = y === startYear ? startMonth : 0;
      const monthEnd = y === endYear ? endMonth : 11;

      for (let m = monthStart; m <= monthEnd; m++) {
        const monthStr = String(m + 1).padStart(2, "0");
        buckets.push(`${y}-${monthStr}`);
      }
    }
  } else if (granularity === "y") {
    // Anual: 12 buckets (uno por mes del año actual)
    // Nota: Esto asume que el rango es de aproximadamente 1 año
    const year = start.getUTCFullYear();
    for (let m = 0; m < 12; m++) {
      const monthStr = String(m + 1).padStart(2, "0");
      buckets.push(`${year}-${monthStr}`);
    }
  }

  return buckets;
}

/**
 * Deriva el rango anterior con la misma longitud que el rango actual
 */
function derivePreviousRange(
  currentStart: string,
  currentEnd: string
): { start: string; end: string } {
  const start = parseISO(currentStart);
  const end = parseISO(currentEnd);

  // Calcular la longitud en días
  const lengthMs = end.getTime() - start.getTime();
  const lengthDays = Math.ceil(lengthMs / (24 * 60 * 60 * 1000));

  // Retroceder desde currentStart
  const prevEnd = addDaysUTC(start, -1);
  const prevStart = addDaysUTC(prevEnd, -lengthDays + 1);

  return {
    start: toISO(prevStart),
    end: toISO(prevEnd),
  };
}

/* ==================== Función Principal ==================== */

/**
 * Bucketiza registros del universo según granularidad
 *
 * @param currentRecords - Registros del rango actual
 * @param previousRecords - Registros del rango anterior
 * @param granularity - Granularidad temporal
 * @param currentRange - Rango actual {start, end}
 * @returns Datos bucketizados con xLabels, current[], previous[]
 */
export function bucketize(
  currentRecords: UniverseRecord[],
  previousRecords: UniverseRecord[],
  granularity: WindowGranularity,
  currentRange: { start: string; end: string }
): BucketizedData {
  // Derivar rango anterior
  const previousRange = derivePreviousRange(
    currentRange.start,
    currentRange.end
  );

  // Generar buckets para ambos rangos (deben tener la misma cantidad)
  const currentBuckets = generateBuckets(
    currentRange.start,
    currentRange.end,
    granularity
  );
  const previousBuckets = generateBuckets(
    previousRange.start,
    previousRange.end,
    granularity
  );

  // Asegurar que tengan la misma longitud (por si acaso)
  const bucketCount = Math.max(currentBuckets.length, previousBuckets.length);
  while (currentBuckets.length < bucketCount) {
    currentBuckets.push(currentBuckets[currentBuckets.length - 1]);
  }
  while (previousBuckets.length < bucketCount) {
    previousBuckets.push(previousBuckets[previousBuckets.length - 1]);
  }

  // Inicializar arrays con 0
  const currentValues = new Array(bucketCount).fill(0);
  const previousValues = new Array(bucketCount).fill(0);

  // Agrupar registros actuales por bucket
  for (const record of currentRecords) {
    const bucket = timeToBucket(record.time, granularity);
    const index = currentBuckets.indexOf(bucket);
    if (index >= 0) {
      currentValues[index] += record.value;
    }
  }

  // Agrupar registros anteriores por bucket
  for (const record of previousRecords) {
    const bucket = timeToBucket(record.time, granularity);
    const index = previousBuckets.indexOf(bucket);
    if (index >= 0) {
      previousValues[index] += record.value;
    }
  }

  return {
    xLabels: currentBuckets,
    current: currentValues,
    previous: previousValues,
    meta: {
      granularity,
      currentRange,
      previousRange,
      totalBuckets: bucketCount,
    },
  };
}

/**
 * Bucketiza registros agrupados por subgrupo (para series comparativas)
 *
 * @param currentRecordsByGroup - Mapa de grupo → registros actuales
 * @param previousRecordsByGroup - Mapa de grupo → registros anteriores
 * @param granularity - Granularidad temporal
 * @param currentRange - Rango actual {start, end}
 * @returns Mapa de grupo → datos bucketizados
 */
export function bucketizeByGroup(
  currentRecordsByGroup: Map<string, UniverseRecord[]>,
  previousRecordsByGroup: Map<string, UniverseRecord[]>,
  granularity: WindowGranularity,
  currentRange: { start: string; end: string }
): Map<string, BucketizedData> {
  const result = new Map<string, BucketizedData>();

  // Obtener todos los grupos únicos
  const allGroups = new Set([
    ...Array.from(currentRecordsByGroup.keys()),
    ...Array.from(previousRecordsByGroup.keys()),
  ]);

  // Bucketizar cada grupo
  for (const group of allGroups) {
    const currentRecords = currentRecordsByGroup.get(group) || [];
    const previousRecords = previousRecordsByGroup.get(group) || [];

    const bucketized = bucketize(
      currentRecords,
      previousRecords,
      granularity,
      currentRange
    );

    result.set(group, bucketized);
  }

  return result;
}
