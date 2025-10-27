/**
 * Construcción de datos bucketizados para charts (donut + series)
 *
 * PRINCIPIO: Mismo universo para donut y series (sin divergencias)
 *
 * - Nivel 1: Usa GroupedResult del particionado
 * - Nivel 2: Puede ser "Otros" (con payload) o grupo normal
 * - Top-5 solo para gráfica, donut muestra todos
 */

import type { CategoryId } from "@/lib/taxonomy/categories";
import type { WindowGranularity } from "@/lib/types";
import { addDaysUTC, parseISO, toISO } from "@/lib/utils/time/datetime";
import {
  type GroupedResult,
  type OthersPayload,
  type RawPoint,
  type RawSeriesByKey,
  OTHERS_ID,
  OTHERS_LABEL,
  getGroupLabel,
  groupByLeaf,
} from "./partition";

/* ==================== Tipos ==================== */

export type DateRange = { start: string; end: string };

/**
 * Datos bucketizados listos para charts
 */
export type Bucketized = {
  /** Etiquetas del eje X (YYYY-MM-DD | YYYY-MM | YYYY) */
  xLabels: string[];

  /** Valores por grupo para current period */
  currentByGroup: Record<string, number[]>;

  /** Valores por grupo para previous period */
  previousByGroup: Record<string, number[]>;

  /** Totales por grupo (para donut) */
  totalsByGroup: Record<string, number>;

  /** Labels legibles por grupo */
  labelsByGroup: Record<string, string>;
};

/**
 * Entrada para nivel 1
 */
export type BuildLevel1Input = {
  grouped: GroupedResult;
  granularity: WindowGranularity;
  current: DateRange;
};

/**
 * Parámetros para nivel 2 "Otros"
 */
export type Level2ParamsOthers = {
  kind: "others";
  categoryId: CategoryId;
  others: OthersPayload;
  granularity: WindowGranularity;
  range: DateRange;
};

/**
 * Parámetros para nivel 2 grupo normal
 */
export type Level2ParamsGroup = {
  kind: "group";
  categoryId: CategoryId;
  groupId: string;
  granularity: WindowGranularity;
  range: DateRange;
  data: RawSeriesByKey;
};

/* ==================== Bucketización Principal ==================== */

/**
 * Construye datos bucketizados para nivel 1
 *
 * Inserta "Otros" como grupo virtual si existe en grouped.others
 * Garantiza coherencia entre donut y series (mismo universo)
 */
export function buildBucketizedForLevel1(input: BuildLevel1Input): Bucketized {
  const { grouped, granularity, current } = input;
  const previous = derivePreviousRange(current);

  // Clonar groups e insertar "Otros" si existe
  const groups = { ...grouped.groups };
  const labelsByGroup: Record<string, string> = {};

  if (
    grouped.mode === "town-first" &&
    grouped.others &&
    grouped.others.entries.length > 0
  ) {
    // Insertar grupo virtual "__others__"
    groups[OTHERS_ID] = grouped.others.entries;
    labelsByGroup[OTHERS_ID] = OTHERS_LABEL;
  }

  // Generar labels para todos los grupos
  for (const groupId of Object.keys(groups)) {
    if (groupId === OTHERS_ID) continue;
    labelsByGroup[groupId] = getGroupLabel(groupId, grouped.mode);
  }

  // Generar xLabels para los buckets
  const xLabels = generateBuckets(current.start, current.end, granularity);

  // Bucketizar cada grupo
  const currentByGroup: Record<string, number[]> = {};
  const previousByGroup: Record<string, number[]> = {};
  const totalsByGroup: Record<string, number> = {};

  for (const [groupId, entries] of Object.entries(groups)) {
    const currentBuckets = bucketizeEntries(
      entries,
      current,
      granularity,
      xLabels
    );
    const previousBuckets = bucketizeEntries(
      entries,
      previous,
      granularity,
      xLabels
    );

    currentByGroup[groupId] = currentBuckets;
    previousByGroup[groupId] = previousBuckets;
    totalsByGroup[groupId] = currentBuckets.reduce((sum, val) => sum + val, 0);
  }

  return {
    xLabels,
    currentByGroup,
    previousByGroup,
    totalsByGroup,
    labelsByGroup,
  };
}

/**
 * Construye nivel 2 desde "Otros" (drilldown de claves no mapeadas)
 */
export function buildLevel2FromOthers(params: Level2ParamsOthers): Bucketized {
  // Re-agrupar por leaf (último token)
  const byLeaf = groupByLeaf(params.others.entries);

  // Construir bucketized usando los grupos de leaf
  const previous = derivePreviousRange(params.range);
  const xLabels = generateBuckets(
    params.range.start,
    params.range.end,
    params.granularity
  );

  const currentByGroup: Record<string, number[]> = {};
  const previousByGroup: Record<string, number[]> = {};
  const totalsByGroup: Record<string, number> = {};
  const labelsByGroup: Record<string, string> = {};

  for (const [leaf, entries] of Object.entries(byLeaf)) {
    const currentBuckets = bucketizeEntries(
      entries,
      params.range,
      params.granularity,
      xLabels
    );
    const previousBuckets = bucketizeEntries(
      entries,
      previous,
      params.granularity,
      xLabels
    );

    currentByGroup[leaf] = currentBuckets;
    previousByGroup[leaf] = previousBuckets;
    totalsByGroup[leaf] = currentBuckets.reduce((sum, val) => sum + val, 0);

    // Label = capitalizar leaf
    labelsByGroup[leaf] = leaf
      .replace(/_/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());
  }

  return {
    xLabels,
    currentByGroup,
    previousByGroup,
    totalsByGroup,
    labelsByGroup,
  };
}

/**
 * Construye nivel 2 desde grupo normal
 * TODO: Implementar según necesidades
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function buildLevel2FromGroup(params: Level2ParamsGroup): Bucketized {
  // Por ahora, placeholder
  return {
    xLabels: [],
    currentByGroup: {},
    previousByGroup: {},
    totalsByGroup: {},
    labelsByGroup: {},
  };
}

/* ==================== Helpers de Bucketización ==================== */

/**
 * Deriva el rango anterior con la misma longitud que el actual
 */
function derivePreviousRange(current: DateRange): DateRange {
  const start = parseISO(current.start);
  const end = parseISO(current.end);

  const lengthMs = end.getTime() - start.getTime();
  const lengthDays = Math.ceil(lengthMs / (24 * 60 * 60 * 1000));

  const prevEnd = addDaysUTC(start, -1);
  const prevStart = addDaysUTC(prevEnd, -lengthDays + 1);

  return {
    start: toISO(prevStart),
    end: toISO(prevEnd),
  };
}

/**
 * Genera lista de buckets (labels del eje X)
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
    // Anual: 12 buckets (uno por mes)
    const year = start.getUTCFullYear();
    for (let m = 0; m < 12; m++) {
      const monthStr = String(m + 1).padStart(2, "0");
      buckets.push(`${year}-${monthStr}`);
    }
  }

  return buckets;
}

/**
 * Convierte tiempo YYYYMMDD a bucket según granularidad
 */
function timeToBucket(time: string, granularity: WindowGranularity): string {
  if (time.length !== 8) return time;

  const iso = `${time.slice(0, 4)}-${time.slice(4, 6)}-${time.slice(6, 8)}`;

  switch (granularity) {
    case "d":
      return iso; // YYYY-MM-DD
    case "m":
      return iso.slice(0, 7); // YYYY-MM
    case "y":
      return iso.slice(0, 4); // YYYY
    default:
      return iso;
  }
}

/**
 * Bucketiza un conjunto de entries para un rango específico
 */
function bucketizeEntries(
  entries: Array<{ key: string; points: RawPoint[] }>,
  range: DateRange,
  granularity: WindowGranularity,
  xLabels: string[]
): number[] {
  const buckets = new Array(xLabels.length).fill(0);

  for (const entry of entries) {
    for (const point of entry.points) {
      const bucket = timeToBucket(point.time, granularity);
      const index = xLabels.indexOf(bucket);

      if (index >= 0) {
        buckets[index] += point.value || 0;
      }
    }
  }

  return buckets;
}

/* ==================== Utilidades para UI ==================== */

/**
 * Obtiene top-N grupos por total (para gráfica)
 */
export function getTopGroups(
  totalsByGroup: Record<string, number>,
  n: number = 5
): string[] {
  return Object.entries(totalsByGroup)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n)
    .map(([groupId]) => groupId);
}

/**
 * Prepara datos para donut chart
 */
export function prepareDonutData(
  totalsByGroup: Record<string, number>,
  labelsByGroup: Record<string, string>
): Array<{ label: string; value: number; id: string }> {
  return Object.entries(totalsByGroup)
    .map(([groupId, value]) => ({
      id: groupId,
      label: labelsByGroup[groupId] || groupId,
      value,
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Prepara datos para series chart (con top-N opcional)
 */
export function prepareSeriesData(
  bucketized: Bucketized,
  topN?: number
): Array<{ name: string; id: string; data: number[] }> {
  const groupIds = topN
    ? getTopGroups(bucketized.totalsByGroup, topN)
    : Object.keys(bucketized.currentByGroup);

  return groupIds.map((groupId) => ({
    id: groupId,
    name: bucketized.labelsByGroup[groupId] || groupId,
    data: bucketized.currentByGroup[groupId] || [],
  }));
}
