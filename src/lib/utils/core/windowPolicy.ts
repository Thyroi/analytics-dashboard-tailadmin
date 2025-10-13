// src/lib/utils/windowPolicy.ts
import type { Granularity } from "@/lib/types";
import {
  addDaysUTC,
  addMonthsUTC,
  endOfMonthUTC,
  parseISO,
  toISO,
  todayUTC,
} from "@/lib/utils/time/datetime";

/** ===================== Configuración ===================== **/
export const TARGET_POINTS_DEFAULT = 24; // objetivo de puntos en series
export const MAX_POINTS_DEFAULT = 36; // tope duro de puntos

/** ===================== Tipos públicos ===================== **/
export type DateRange = { start: string; end: string };

export type BucketUnit = "day" | "month";
export type DayBucketSize = 1 | 7 | 15 | 30;

export type BucketSpec =
  | { unit: "day"; size: DayBucketSize } // 1, 7, 15, 30 días
  | { unit: "month"; size: 1 }; // 1 mes

export type AxisLabel = string; // YYYY-MM-DD (day buckets) | YYYY-MM (month)

export type SeriesWindows = {
  /** Ventana actual con agregación por buckets ya decidida */
  current: DateRange;
  /** Ventana previous = current desplazada 1 bucket (con solape) */
  previous: DateRange;
  /** Unión para optimizar la query GA: previous.start → current.end */
  query: DateRange;
  /** Listado de buckets (inicio y fin concretos) para agregación lado servidor */
  buckets: Array<{ start: string; end: string; label: AxisLabel }>;
  /** Etiquetas para el eje X (alineadas 1:1 con `buckets`) */
  axisLabels: AxisLabel[];
  /** Especificación del bucket elegido */
  bucket: BucketSpec;
};

export type DonutWindow = {
  /** Rango a usar para donut (1 día si bucket diario; si no, toda la ventana current) */
  current: DateRange;
};

export type WindowSets = {
  granularity: Granularity;
  range: { current: DateRange; previous: DateRange };
  series: SeriesWindows;
  donut: DonutWindow;
};

export type WindowPolicyOptions = {
  /** granularidad seleccionada (para presets si no hay rango); en modo rango es sólo un hint */
  granularity: Granularity;
  /** Si llega start+end ⇒ modo rango (auto-bucket); si no ⇒ presets por g */
  startISO?: string;
  endISO?: string;
  /** Tuning de puntos */
  targetPoints?: number; // por defecto TARGET_POINTS_DEFAULT
  maxPoints?: number; // por defecto MAX_POINTS_DEFAULT
};

/** ===================== Helpers base ===================== **/
function clampEndToYesterday(endISO?: string): string {
  const end = endISO ? parseISO(endISO) : addDaysUTC(todayUTC(), -1);
  const y = addDaysUTC(todayUTC(), -1);
  return toISO(end > y ? y : end);
}

function ensureOrderedRange(aISO: string, bISO: string): DateRange {
  return aISO <= bISO ? { start: aISO, end: bISO } : { start: bISO, end: aISO };
}

function daysDiffInclusiveISO(startISO: string, endISO: string): number {
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  const ms =
    Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate()) -
    Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate());
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

function enumMonthsStartLabels(startISO: string, endISO: string): string[] {
  // Etiquetas YYYY-MM (inicio de mes del bucket)
  const out: string[] = [];
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  // Normalizar a primer día del mes
  let cur = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), 1));
  const end = new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), 1));
  while (cur <= end) {
    const yyyy = cur.getUTCFullYear();
    const mm = String(cur.getUTCMonth() + 1).padStart(2, "0");
    out.push(`${yyyy}-${mm}`);
    cur = addMonthsUTC(cur, 1);
  }
  return out;
}

/** Particiona un rango [start..end] en ventanas consecutivas de `windowDays` (última puede ser más corta). */
function splitIntoFixedWindows(
  startISO: string,
  endISO: string,
  windowDays: DayBucketSize
) {
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  const buckets: Array<{ start: string; end: string; label: AxisLabel }> = [];
  let curStart = s;
  while (curStart <= e) {
    const curEnd = addDaysUTC(curStart, windowDays - 1);
    const end = curEnd > e ? e : curEnd;
    buckets.push({
      start: toISO(curStart),
      end: toISO(end),
      label: toISO(curStart), // etiqueta base YYYY-MM-DD (el front puede formatear a “DD” para 7/15/30)
    });
    curStart = addDaysUTC(end, 1);
  }
  return buckets;
}

/** ===================== Selección de bucket (auto-bucket) ===================== **/
/**
 * Dado el rango en días (N), busca un bucket que:
 *  - Mantenga puntos <= maxPoints
 *  - Se acerque a targetPoints (o lo iguale si es posible)
 *  - Prefiere granularidad más fina cuando empata
 */
export function chooseAutoBucket(
  startISO: string,
  endISO: string,
  opts?: { targetPoints?: number; maxPoints?: number }
): BucketSpec {
  const target = opts?.targetPoints ?? TARGET_POINTS_DEFAULT;
  const max = opts?.maxPoints ?? MAX_POINTS_DEFAULT;
  const N = daysDiffInclusiveISO(startISO, endISO);

  // Opciones candidatas de buckets por día
  const daySizes: DayBucketSize[] = [1, 7, 15, 30];

  // Si el rango es muchísimo (> ~1 año), pasamos a mensual directo
  if (N > 365) return { unit: "month", size: 1 };

  // Evaluamos cada tamaño y elegimos el que mejor se ajusta
  type Candidate = { spec: BucketSpec; points: number; overshoot: number };
  const candidates: Candidate[] = [];

  for (const size of daySizes) {
    const points = Math.ceil(N / size);
    if (points > max) continue; // descarta si excede el tope duro
    const overshoot = Math.max(0, points - target); // cuánto nos pasamos del target
    candidates.push({ spec: { unit: "day", size }, points, overshoot });
  }

  if (candidates.length === 0) {
    // Ningún bucket diario cumple el tope → usamos mes
    return { unit: "month", size: 1 };
  }

  // Orden:
  // 1) menor overshoot
  // 2) si empata, menor diferencia absoluta a target
  // 3) si empata, preferimos más fino (size menor)
  candidates.sort((a, b) => {
    if (a.overshoot !== b.overshoot) return a.overshoot - b.overshoot;
    const da = Math.abs(a.points - target);
    const db = Math.abs(b.points - target);
    if (da !== db) return da - db;
    if (a.spec.unit === "day" && b.spec.unit === "day") {
      return a.spec.size - b.spec.size; // más fino primero
    }
    return 0;
  });

  return candidates[0].spec;
}

/** ===================== Builder central (preset o rango con auto-bucket) ===================== **/
export function buildWindowSets(opts: WindowPolicyOptions): WindowSets {
  const {
    granularity: g,
    startISO,
    endISO,
    targetPoints = TARGET_POINTS_DEFAULT,
    maxPoints = MAX_POINTS_DEFAULT,
  } = opts;

  // 1) Determinar el rango "current" base:
  let currentBase: DateRange;
  if (startISO && endISO) {
    // MODO RANGO (DatePicker)
    const end = clampEndToYesterday(endISO);
    currentBase = ensureOrderedRange(startISO, end);
  } else {
    // MODO PRESET (Granularity tabs)
    const y = addDaysUTC(todayUTC(), -1);
    if (g === "d") {
      currentBase = { start: toISO(addDaysUTC(y, -6)), end: toISO(y) }; // 7 días
    } else if (g === "w") {
      currentBase = { start: toISO(addDaysUTC(y, -6)), end: toISO(y) }; // 7 días
    } else if (g === "m") {
      currentBase = { start: toISO(addDaysUTC(y, -29)), end: toISO(y) }; // 30 días
    } else {
      // g === "y" -> 12 meses (de primer día del mes (end-11m) a fin de mes de end)
      const endMonth = new Date(
        Date.UTC(y.getUTCFullYear(), y.getUTCMonth(), 1)
      );
      const startMonth = addMonthsUTC(endMonth, -11);
      const start = `${startMonth.getUTCFullYear()}-${String(
        startMonth.getUTCMonth() + 1
      ).padStart(2, "0")}-01`;
      const end = toISO(endOfMonthUTC(endMonth));
      currentBase = { start, end };
    }
  }

  // 2) Elegir bucket:
  let bucket: BucketSpec;
  if (startISO && endISO) {
    // Auto-bucket por rango
    bucket = chooseAutoBucket(currentBase.start, currentBase.end, {
      targetPoints,
      maxPoints,
    });
  } else {
    // Bucket por preset
    if (g === "y") bucket = { unit: "month", size: 1 };
    else bucket = { unit: "day", size: 1 };
  }

  // 3) Construir buckets y ventanas de series para current:
  let bucketsCurrent: Array<{ start: string; end: string; label: AxisLabel }>;
  if (bucket.unit === "month") {
    // 1 mes: etiquetamos YYYY-MM (inicio de mes)
    const labels = enumMonthsStartLabels(currentBase.start, currentBase.end);
    bucketsCurrent = labels.map((ym) => {
      const [yy, mm] = ym.split("-");
      const sd = `${yy}-${mm}-01`;
      const ed = toISO(
        endOfMonthUTC(new Date(Date.UTC(Number(yy), Number(mm) - 1, 1)))
      );
      return { start: sd, end: ed, label: ym };
    });
  } else {
    // 1d / 7d / 15d / 30d: buckets por días
    bucketsCurrent = splitIntoFixedWindows(
      currentBase.start,
      currentBase.end,
      bucket.size as DayBucketSize
    );
  }

  // 4) Previous = current desplazado 1 bucket (con solape):
  const shiftPrev = (r: DateRange): DateRange => {
    if (bucket.unit === "month") {
      return {
        start: toISO(addMonthsUTC(parseISO(r.start), -1)),
        end: toISO(addMonthsUTC(parseISO(r.end), -1)),
      };
    }
    return {
      start: toISO(
        addDaysUTC(
          parseISO(r.start),
          -(bucket as Extract<BucketSpec, { unit: "day" }>).size
        )
      ),
      end: toISO(
        addDaysUTC(
          parseISO(r.end),
          -(bucket as Extract<BucketSpec, { unit: "day" }>).size
        )
      ),
    };
  };
  const previousBase = shiftPrev(currentBase);

  // 5) Donut: si bucket diario (1d), usar sólo el último día; si no, toda la current
  const donutCurrent: DateRange =
    bucket.unit === "day" &&
    (bucket as Extract<BucketSpec, { unit: "day" }>).size === 1
      ? { start: currentBase.end, end: currentBase.end }
      : { ...currentBase };

  // 6) Armar ventana de query unificada
  const queryRange: DateRange = {
    start: previousBase.start,
    end: currentBase.end,
  };

  // 7) Eje (labels) = labels de current (ordenadas)
  const axisLabels = bucketsCurrent.map((b) => b.label);

  return {
    granularity: g,
    range: { current: currentBase, previous: previousBase },
    series: {
      current: currentBase,
      previous: previousBase,
      query: queryRange,
      buckets: bucketsCurrent, // buckets de current; previous se obtiene desplazando el rango
      axisLabels,
      bucket,
    },
    donut: { current: donutCurrent },
  };
}
