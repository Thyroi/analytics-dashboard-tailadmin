import type { ChatbotGranularity, ChatbotPoint } from "@/lib/api/chatbot";
import { isoFromYYYYMMDD } from "./datetime";

/** ---------- helpers base ---------- */
// const pad = (n: number, w = 2) => String(n).padStart(w, "0"); // TEMPORALMENTE NO USADO
const toISO = (d: Date) => d.toISOString().slice(0, 10);
const parseISO = (iso: string) => new Date(`${iso}T00:00:00Z`);
// const addDays = (d: Date, n: number) => { // TEMPORALMENTE NO USADO
//   const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
//   x.setUTCDate(x.getUTCDate() + n);
//   return x;
// };

/** ---------- normalizadores por granularidad ---------- */
// Lunes aproximado de la semana (ISO-like) para ordenar
export function approxMondayFromYearWeek(yyyyWW: string): string {
  const [yy, ww] = yyyyWW.split("/");
  const y = Number(yy),
    w = Number(ww);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const jan4Dow = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() + (1 - jan4Dow) + (w - 1) * 7);
  return toISO(monday);
}

export function firstDayFromYYYYMM(yyyyMM: string): string {
  const [y, m] = yyyyMM.split("/");
  return `${y}-${m}-01`;
}

/** Convierte la clave `time` de la API a un ISO representativo (para ordenar/alinear). */
export function normalizeKeyToISO(time: string, g: ChatbotGranularity): string {
  if (g === "d") return isoFromYYYYMMDD(time);
  if (g === "w") return approxMondayFromYearWeek(time);
  if (g === "m") return firstDayFromYYYYMM(time);
  // y
  return `${time}-01-01`;
}

/** ---------- formateador de etiqueta de eje ---------- */
export function formatAxisLabel(
  time: string,
  g: ChatbotGranularity,
  locale = "es-ES"
): string {
  if (g === "d") {
    const d = parseISO(isoFromYYYYMMDD(time));
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
    }).format(d); // ej: "7 sept"
  }
  if (g === "w") {
    const iso = normalizeKeyToISO(time, "w");
    const d = parseISO(iso);
    const year = d.getUTCFullYear();
    const week = time.split("/")[1];
    return `sem ${week} · ${year}`;
  }
  if (g === "m") {
    const [y, m] = time.split("/");
    const d = parseISO(`${y}-${m}-01`);
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      year: "numeric",
    }).format(d); // "sep 2025"
  }
  // y
  return time; // "2025"
}

/** Ordena claves por tiempo real usando la normalización a ISO. */
export function sortTimesChronologically(
  times: string[],
  g: ChatbotGranularity
): string[] {
  return [...times].sort((a, b) => {
    const ia = normalizeKeyToISO(a, g);
    const ib = normalizeKeyToISO(b, g);
    return ia < ib ? -1 : ia > ib ? 1 : 0;
  });
}

/** Deriva labels e índices a partir de un conjunto de series (output de la API). */
export function buildAxisFromChatbot(
  seriesMap: Record<string, ChatbotPoint[]>,
  g: ChatbotGranularity,
  locale = "es-ES"
) {
  if (g === "y") {
    // Eje mensual: últimos 12 meses, formato 'YYYY/MM' para alinearse con la API/mock
    const allPoints: ChatbotPoint[] = Object.values(seriesMap).flat();
    let maxDate: Date | null = null;
    for (const p of allPoints) {
      let d: Date;
      if (p.time.length === 7 && p.time.includes("/")) {
        // YYYY/MM
        const [y, m] = p.time.split("/");
        d = parseISO(`${y}-${m}-01`);
      } else if (p.time.length === 8) {
        d = parseISO(
          `${p.time.slice(0, 4)}-${p.time.slice(4, 6)}-${p.time.slice(6, 8)}`
        );
      } else if (p.time.length === 10) {
        d = parseISO(p.time);
      } else {
        continue;
      }
      if (!maxDate || d > maxDate) maxDate = d;
    }
    const endDate = maxDate ?? new Date();
    const labels: string[] = [];
    const keys: string[] = [];
    const endY = endDate.getUTCFullYear();
    const endM = endDate.getUTCMonth();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(endY, endM - i, 1));
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      labels.push(`${d.getUTCFullYear()}-${mm}`);
      keys.push(`${d.getUTCFullYear()}/${mm}`);
    }
    const indexByKey = new Map(keys.map((k, i) => [k, i]));
    return { keysOrdered: keys, xLabels: labels, indexByKey };
  }
  // --- resto granularidades ---
  const allTimes = new Set<string>();
  for (const points of Object.values(seriesMap)) {
    points?.forEach((p: ChatbotPoint) => allTimes.add(p.time));
  }
  const keysOrdered = sortTimesChronologically([...allTimes], g);
  const xLabels = keysOrdered.map((k) => formatAxisLabel(k, g, locale));
  const indexByKey = new Map(keysOrdered.map((k, i) => [k, i]));
  return { keysOrdered, xLabels, indexByKey };
}
/** Rellena una serie (sparse) a vector alineado con `keysOrdered`. */
export function materializeSeries(
  points: ChatbotPoint[] | undefined,
  keysOrdered: string[]
): number[] {
  const byKey = new Map<string, number>();
  (points ?? []).forEach((p) => byKey.set(p.time, p.value || 0));
  return keysOrdered.map((k) => byKey.get(k) ?? 0);
}
