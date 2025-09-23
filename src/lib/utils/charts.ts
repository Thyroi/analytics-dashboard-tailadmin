// lib/utils/charts.ts
import type { DonutDatum, Granularity, SeriesPoint,  } from "@/lib/types";
import {
  parseISO,
  toISO,
  addDaysUTC,
  startOfMonthUTC,
  endOfMonthUTC,
  startOfYearUTC,
  endOfYearUTC,
} from "@/lib/utils/datetime";
/**
 * Obtiene el delta porcentual de una categoría de forma segura.
 * Retorna 0 si el estado no está listo o el valor no existe.
 */
export function getDeltaPctForCategory(
  state: { status: string },
  itemsById: Record<string, { deltaPct: number }>,
  id: string
): number {
  if (state.status !== "ready") return 0;
  return Math.round(itemsById[id]?.deltaPct ?? 0);
}

/**
 * Retorna una estructura vacía para series actuales y previas.
 * Útil como valor inicial antes de que lleguen datos reales.
 */
export function getEmptySeries(): { current: SeriesPoint[]; previous: SeriesPoint[] } {
  return { current: [], previous: [] };
}

/**
 * Retorna un array vacío para los datos de un gráfico tipo donut/pie.
 * Útil como placeholder inicial.
 */
export function getEmptyDonut(): DonutDatum[] {
  return [];
}

export type Bucket = {
  id: string;    // ej. "2025-09-01", "W0_2025-09-01", "2025-09", "2025"
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  label: string; // lo que muestra el eje X; puedes re-formatear en UI
};

function clampRange(
  startISO: string,
  endISO: string,
  clampStartISO: string,
  clampEndISO: string
) {
  const start = startISO > clampStartISO ? startISO : clampStartISO;
  const end = endISO < clampEndISO ? endISO : clampEndISO;
  return { start, end };
}

/** Construye buckets para [start..end] según g ("d" | "w" | "m" | "y"). */
export function makeBuckets(
  g: Granularity,
  startISO: string,
  endISO: string
): Bucket[] {
  if (!startISO || !endISO || startISO > endISO) return [];

  if (g === "d") {
    const out: Bucket[] = [];
    let d = parseISO(startISO);
    const end = parseISO(endISO);
    while (d <= end) {
      const iso = toISO(d);
      out.push({ id: iso, start: iso, end: iso, label: iso });
      d = addDaysUTC(d, 1);
    }
    return out;
  }

  if (g === "w") {
    // Bloques contiguos de 7 días a partir de startISO (rolling por rango)
    const out: Bucket[] = [];
    let bStart = parseISO(startISO);
    const hardEnd = parseISO(endISO);
    let idx = 0;

    while (bStart <= hardEnd) {
      const bEnd = addDaysUTC(bStart, 6);
      const { start, end } = clampRange(
        toISO(bStart),
        toISO(bEnd),
        startISO,
        endISO
      );
      const id = `W${idx}_${start}`;
      const label = `${start} – ${end}`;
      out.push({ id, start, end, label });

      bStart = addDaysUTC(bEnd, 1);
      idx += 1;
    }
    return out;
  }

  if (g === "m") {
    // Meses calendario que intersectan el rango
    const out: Bucket[] = [];
    let cursor = parseISO(startISO);
    const hardEnd = parseISO(endISO);

    // arranca en el primer día del mes del start
    cursor = startOfMonthUTC(cursor);

    while (cursor <= hardEnd) {
      const monthStart = startOfMonthUTC(cursor);
      const monthEnd = endOfMonthUTC(cursor);
      const { start, end } = clampRange(
        toISO(monthStart),
        toISO(monthEnd),
        startISO,
        endISO
      );
      const id = toISO(monthStart).slice(0, 7); // "YYYY-MM"
      const label = id;
      out.push({ id, start, end, label });

      // avanza un mes
      const next = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1));
      cursor = next;
    }
    return out;
  }

  // g === "y"
  {
    const out: Bucket[] = [];
    let cursor = parseISO(startISO);
    const hardEnd = parseISO(endISO);

    // arranca en el primer día del año del start
    cursor = startOfYearUTC(cursor);

    while (cursor <= hardEnd) {
      const yearStart = startOfYearUTC(cursor);
      const yearEnd = endOfYearUTC(cursor);
      const { start, end } = clampRange(
        toISO(yearStart),
        toISO(yearEnd),
        startISO,
        endISO
      );
      const id = String(yearStart.getUTCFullYear()); // "YYYY"
      const label = id;
      out.push({ id, start, end, label });

      const next = new Date(Date.UTC(yearStart.getUTCFullYear() + 1, 0, 1));
      cursor = next;
    }
    return out;
  }
}

/** Devuelve el id del bucket que contiene dateISO (o null). */
export function bucketOf(dateISO: string, buckets: Bucket[]): string | null {
  for (const b of buckets) {
    if (dateISO >= b.start && dateISO <= b.end) return b.id;
  }
  return null;
}

/**
 * Convierte mapas diarios -> series agrupadas por g para current y previous.
 * - currByDate / prevByDate: Map<YYYY-MM-DD, value>
 */
export function groupFromDailyMaps(
  g: Granularity,
  ranges: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  },
  currByDate: Map<string, number>,
  prevByDate: Map<string, number>
): {
  series: { current: SeriesPoint[]; previous: SeriesPoint[] };
  totals: { current: number; previous: number };
} {
  const bCur = makeBuckets(g, ranges.current.start, ranges.current.end);
  const bPrev = makeBuckets(g, ranges.previous.start, ranges.previous.end);

  const accCur = new Map<string, number>(bCur.map(b => [b.id, 0]));
  const accPrev = new Map<string, number>(bPrev.map(b => [b.id, 0]));

  let totalCur = 0;
  let totalPrev = 0;

  for (const [iso, v] of currByDate.entries()) {
    const id = bucketOf(iso, bCur);
    if (!id) continue;
    accCur.set(id, (accCur.get(id) ?? 0) + v);
    totalCur += v;
  }
  for (const [iso, v] of prevByDate.entries()) {
    const id = bucketOf(iso, bPrev);
    if (!id) continue;
    accPrev.set(id, (accPrev.get(id) ?? 0) + v);
    totalPrev += v;
  }

  const series = {
    current: bCur.map(b => ({ label: b.label, value: accCur.get(b.id) ?? 0 })),
    previous: bPrev.map(b => ({ label: b.label, value: accPrev.get(b.id) ?? 0 })),
  };

  return { series, totals: { current: totalCur, previous: totalPrev } };
}
