// src/lib/utils/timeAxis.ts
import type { Granularity } from "@/lib/types";
import { addDaysUTC, parseISO, toISO, todayUTC } from "@/lib/utils/time/datetime";

/** Eje y ventanas “lagged”:
 * - d/w → 7 días terminando ayer (o endISO) y previous = esos mismos 7 días pero -1 día
 * - m   → 30 días terminando ayer (o endISO) y previous = 30 días -1 día
 * - y   → 12 meses; previous = esos 12 meses -1 mes (alineados por índice)
 */
export type AxisLagged = {
  dimensionTime: "date" | "yearMonth";
  xLabels: string[]; // etiquetas para el eje X (current)
  curRange: { start: string; end: string };
  prevRange: { start: string; end: string };
  queryRange: { start: string; end: string }; // unión para GA
  curKeys: string[]; // keys para current (YYYY-MM-DD | YYYYMM)
  prevKeys: string[]; // keys para previous (misma longitud, desplazadas 1 slot)
  curIndexByKey: Map<string, number>;
  prevIndexByKey: Map<string, number>;
};

export function enumerateDaysUTC(startISO: string, endISO: string): string[] {
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  const cur = new Date(
    Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate())
  );
  const end = new Date(
    Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate())
  );
  const out: string[] = [];
  while (cur <= end) {
    out.push(toISO(cur));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

function ymKey(y: number, mZero: number): string {
  const mm = String(mZero + 1).padStart(2, "0");
  return `${y}${mm}`; // YYYYMM
}
function ymLabel(y: number, mZero: number): string {
  const mm = String(mZero + 1).padStart(2, "0");
  return `${y}-${mm}`; // YYYY-MM
}

/** Últimos n meses (incluyendo el mes de endDate) */
function listLastNMonths(endDate: Date, n = 12) {
  const labels: string[] = [];
  const keys: string[] = [];
  const endY = endDate.getUTCFullYear();
  const endM = endDate.getUTCMonth();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(endY, endM - i, 1));
    labels.push(ymLabel(d.getUTCFullYear(), d.getUTCMonth()));
    keys.push(ymKey(d.getUTCFullYear(), d.getUTCMonth()));
  }
  return { labels, keys };
}

export function buildLaggedAxisForGranularity(
  g: Granularity,
  opts?: { endISO?: string }
): AxisLagged {
  const endBase = opts?.endISO
    ? parseISO(opts.endISO)
    : addDaysUTC(todayUTC(), -1);
  const isYear = g === "y";

  if (isYear) {
    // 12 meses current + previous desplazados -1 mes
    const cur = listLastNMonths(endBase, 12);
    const prevEnd = new Date(
      Date.UTC(endBase.getUTCFullYear(), endBase.getUTCMonth() - 1, 1)
    );
    const prv = listLastNMonths(prevEnd, 12);

    const curRange = {
      // 12 meses desde el mes (endBase) hacia atrás
      start: `${cur.labels[0]}-01`,
      end: `${cur.labels[cur.labels.length - 1]}-28`, // aproximado, sólo se usa para contexto
    };
    const prevRange = {
      start: `${prv.labels[0]}-01`,
      end: `${prv.labels[prv.labels.length - 1]}-28`,
    };

    return {
      dimensionTime: "yearMonth",
      xLabels: cur.labels,
      curRange,
      prevRange,
      queryRange: { start: prevRange.start, end: curRange.end },
      curKeys: cur.keys, // YYYYMM
      prevKeys: prv.keys, // YYYYMM (12 meses anteriores, alineados por índice)
      curIndexByKey: new Map(cur.keys.map((k, i) => [k, i])),
      prevIndexByKey: new Map(prv.keys.map((k, i) => [k, i])),
    };
  }

  // d / w / m → slots por día
  const N = g === "m" ? 30 : 7; // d y w usan 7; m usa 30
  const curEnd = endBase;
  const curStart = addDaysUTC(curEnd, -(N - 1));
  const prevEnd = addDaysUTC(curEnd, -1);
  const prevStart = addDaysUTC(prevEnd, -(N - 1));

  const curRange = { start: toISO(curStart), end: toISO(curEnd) };
  const prevRange = { start: toISO(prevStart), end: toISO(prevEnd) };

  const curKeys = enumerateDaysUTC(curRange.start, curRange.end); // YYYY-MM-DD
  const prevKeys = enumerateDaysUTC(prevRange.start, prevRange.end); // YYYY-MM-DD

  return {
    dimensionTime: "date",
    xLabels: curKeys,
    curRange,
    prevRange,
    queryRange: { start: prevRange.start, end: curRange.end },
    curKeys,
    prevKeys,
    curIndexByKey: new Map(curKeys.map((k, i) => [k, i])),
    prevIndexByKey: new Map(prevKeys.map((k, i) => [k, i])),
  };
}
