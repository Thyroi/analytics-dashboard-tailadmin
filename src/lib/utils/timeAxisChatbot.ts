import type { ChatbotGranularity, ChatbotPoint } from "@/lib/api/chatbot";

/** ---------- helpers base ---------- */
const pad = (n: number, w = 2) => String(n).padStart(w, "0");
const toISO = (d: Date) => d.toISOString().slice(0, 10);
const parseISO = (iso: string) => new Date(`${iso}T00:00:00Z`);
const addDays = (d: Date, n: number) => {
  const x = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
  x.setUTCDate(x.getUTCDate() + n);
  return x;
};

/** ---------- normalizadores por granularidad ---------- */
export function isoFromYYYYMMDD(yyyymmdd: string): string {
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(
    6,
    8
  )}`;
}

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
  // 1) juntar todas las claves de tiempo que aparezcan en cualquiera de las series
  const allTimes = new Set<string>();
  for (const points of Object.values(seriesMap)) {
    points?.forEach((p) => allTimes.add(p.time));
  }

  // 2) orden cronológico según granularidad
  const keysOrdered = sortTimesChronologically([...allTimes], g);

  // 3) labels “bonitos”
  const xLabels = keysOrdered.map((k) => formatAxisLabel(k, g, locale));

  // 4) índice por clave para rellenar series alineadas
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
