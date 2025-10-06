import type { Granularity } from "@/lib/types";
import { parseISO, toISO } from "@/lib/utils/datetime";

export type AxisInfo = {
  /** "date" para d/w/m (slots por día) | "yearMonth" para y (slots por mes) */
  dimensionTime: "date" | "yearMonth";
  /** Etiquetas a pintar en el eje X (si y => "YYYY-MM", si no => "YYYY-MM-DD") del rango current */
  xLabels: string[];
  /** Claves de slot para mapear filas de GA al vector current (YYYY-MM-DD | YYYYMM) */
  curKeys: string[];
  /** Claves de slot para mapear filas de GA al vector previous (YYYY-MM-DD | YYYYMM) */
  prevKeys: string[];
  /** Índice por clave (current) */
  indexByCurKey: Map<string, number>;
  /** Índice por clave (previous) */
  indexByPrevKey: Map<string, number>;
};

/* ===== helpers de día/mes ===== */

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

function ymLabel(y: number, mZero: number): string {
  const mm = String(mZero + 1).padStart(2, "0");
  return `${y}-${mm}`;
}
function ymKey(y: number, mZero: number): string {
  const mm = String(mZero + 1).padStart(2, "0");
  return `${y}${mm}`;
}

/** Últimos n meses incluyendo el mes de `endDate` */
export function listLastNMonths(endDate: Date, n = 12) {
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

/** Construye la info de eje para current+previous alineados al **mismo número de slots** */
export function buildAxisForGranularity(
  g: Granularity,
  ranges: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  }
): AxisInfo {
  if (g === "y") {
    // 12 meses: current y previous se alinean por índice
    const endCur = parseISO(ranges.current.end);
    const endPrev = parseISO(ranges.previous.end);
    const cur = listLastNMonths(endCur, 12);
    const prv = listLastNMonths(endPrev, 12);
    return {
      dimensionTime: "yearMonth",
      xLabels: cur.labels,
      curKeys: cur.keys,
      prevKeys: prv.keys,
      indexByCurKey: new Map(cur.keys.map((k, i) => [k, i])),
      indexByPrevKey: new Map(prv.keys.map((k, i) => [k, i])),
    };
  }

  // d / w / m => slots por DÍA
  const xLabels = enumerateDaysUTC(ranges.current.start, ranges.current.end);
  const prevLabels = enumerateDaysUTC(
    ranges.previous.start,
    ranges.previous.end
  );
  return {
    dimensionTime: "date",
    xLabels,
    curKeys: xLabels, // YYYY-MM-DD
    prevKeys: prevLabels,
    indexByCurKey: new Map(xLabels.map((k, i) => [k, i])),
    indexByPrevKey: new Map(prevLabels.map((k, i) => [k, i])),
  };
}
