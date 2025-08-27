// src/lib/chatbot/trendUtils.ts
import { SERIES } from "@/lib/mockData";

/* ========= Date helpers ========= */
export function parseISO(d: string): Date | null {
  const m = d.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]) - 1, da = Number(m[3] ?? "1");
  const dt = new Date(Date.UTC(y, mo, da));
  return isNaN(dt.getTime()) ? null : dt;
}
export function toISODay(dt: Date): string {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
export function addDays(dt: Date, n: number): Date {
  const c = new Date(dt);
  c.setUTCDate(c.getUTCDate() + n);
  return c;
}
export function startOfWeekUTC(dt: Date): Date {
  const day = dt.getUTCDay();            // 0..6 (Domingo=0)
  const offset = (day + 6) % 7;          // 0->6, 1->0, ..., 6->5
  return addDays(new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate())), -offset);
}
export function startOfMonthUTC(dt: Date): Date {
  return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), 1));
}
export function endOfMonthUTC(dt: Date): Date {
  const firstNext = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 1));
  return addDays(firstNext, -1);
}

/* ========= Labels ========= */
export function fmtDateLabel(bucket: string): string {
  // YYYY-MM-DD -> "dd MMM"
  if (/^\d{4}-\d{2}-\d{2}$/.test(bucket)) {
    const dt = parseISO(bucket)!;
    return dt.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
  }
  return bucket;
}

/* ========= Aggregations ========= */
export function sumDaily(tags: string[], isoDay: string): number {
  let s = 0;
  for (const t of tags) s += SERIES[t]?.[isoDay] ?? 0;
  return s;
}

/** Ventana ANTERIOR robusta (día/semana/mes) con mismo largo que `categories`. */
export function buildPrevWindowFallback(
  tags: string[],
  categories: string[],
  gran: "day" | "week" | "month"
): number[] {
  const n = categories.length;
  if (n === 0) return [];

  const firstKey = categories[0];
  const firstDt = parseISO(firstKey) ?? new Date(Date.parse(firstKey));

  if (gran === "day") {
    const startPrev = addDays(firstDt, -n);
    const out: number[] = [];
    for (let i = 0; i < n; i++) {
      const d = addDays(startPrev, i);
      out.push(sumDaily(tags, toISODay(d)));
    }
    return out;
  }

  if (gran === "week") {
    const firstWeekStart = startOfWeekUTC(firstDt);
    const prevStart = addDays(firstWeekStart, -7 * n);
    const out: number[] = [];
    for (let i = 0; i < n; i++) {
      const wStart = addDays(prevStart, i * 7);
      let sum = 0;
      for (let k = 0; k < 7; k++) sum += sumDaily(tags, toISODay(addDays(wStart, k)));
      out.push(sum);
    }
    return out;
  }

  // month
  const firstMonthStart = startOfMonthUTC(firstDt);
  const prevFirst = new Date(Date.UTC(firstMonthStart.getUTCFullYear(), firstMonthStart.getUTCMonth() - n, 1));
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const mStart = new Date(Date.UTC(prevFirst.getUTCFullYear(), prevFirst.getUTCMonth() + i, 1));
    const mEnd = endOfMonthUTC(mStart);
    let sum = 0;
    for (let d = new Date(mStart); d <= mEnd; d = addDays(d, 1)) {
      sum += sumDaily(tags, toISODay(d));
    }
    out.push(sum);
  }
  return out;
}

/* ========= Color helpers ========= */
function clamp01(x: number): number { return Math.min(1, Math.max(0, x)); }

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const m = hex.replace("#", "");
  const num = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0; const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d) % 6; break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60; if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

export function hslToHex(h: number, s: number, l: number): string {
  const _s = clamp01(s / 100), _l = clamp01(l / 100);
  const c = (1 - Math.abs(2 * _l - 1)) * _s;
  const hh = (h % 360 + 360) % 360;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = _l - c / 2;
  let r = 0, g = 0, b = 0;
  if (hh < 60) { r = c; g = x; b = 0; }
  else if (hh < 120) { r = x; g = c; b = 0; }
  else if (hh < 180) { r = 0; g = c; b = x; }
  else if (hh < 240) { r = 0; g = x; b = c; }
  else if (hh < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const R = Math.round((r + m) * 255);
  const G = Math.round((g + m) * 255);
  const B = Math.round((b + m) * 255);
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(R)}${toHex(G)}${toHex(B)}`;
}

/* ========= Donut options (Apex subset tipado) ========= */
export type DonutOptions = {
  plotOptions: {
    pie: {
      expandOnClick: boolean;
      donut: {
        size: string;
        labels: {
          show: boolean;
          name: { show: boolean; fontSize: string };
          value: { show: boolean; fontSize: string; formatter: (v: string) => string };
          total: { show: boolean; label: string };
        };
      };
    };
  };
  tooltip: {
    y: { formatter: (v: number) => string };
  };
};

export function buildDonutOptions(
  formatNumber: (v: number) => string,
  totalLabel: string = "Total",
  size: string = "68%"
): DonutOptions {
  return {
    plotOptions: {
      pie: {
        expandOnClick: true,
        donut: {
          size,
          labels: {
            show: true,
            name: { show: true, fontSize: "12px" },
            value: {
              show: true,
              fontSize: "16px",
              formatter: (v: string) => formatNumber(Number(v || 0)),
            },
            total: { show: true, label: totalLabel },
          },
        },
      },
    },
    tooltip: { y: { formatter: (v: number) => formatNumber(v) } },
  };
}

/* ========= Paleta ========= */
export function generateDistinctColors(
  labels: string[],
  baseHex?: string,
  opts?: { minHueDelta?: number; sat?: number; light?: number }
): Record<string, string> {
  const out: Record<string, string> = {};
  if (labels.length === 0) return out;

  const GOLDEN_ANGLE = 137.508;
  const MIN_HUE_DELTA = opts?.minHueDelta ?? 18;
  const baseH = baseHex ? hexToHsl(baseHex).h : 0;

  const satBase = opts?.sat ?? 70;
  const lightBase = opts?.light ?? 55;

  const usedHues: number[] = [];
  for (let i = 0; i < labels.length; i++) {
    let h = (baseH + i * GOLDEN_ANGLE) % 360;
    let tries = 0;
    while (
      usedHues.some((uh) => {
        const d = Math.abs(uh - h);
        return Math.min(d, 360 - d) < MIN_HUE_DELTA;
      }) && tries < 12
    ) {
      h = (h + MIN_HUE_DELTA) % 360;
      tries++;
    }
    usedHues.push(h);
    const s = satBase + (i % 2 === 0 ? 4 : -4);
    const l = lightBase + (i % 3 === 0 ? 4 : -2);
    out[labels[i]] = hslToHex(h, s, l);
  }
  return out;
}

/* ========= X-Axis label formatters ========= */

/** Firma de Apex para el formatter de labels del eje X (subset necesario). */
export type XLabelFormatter = (
  value: string | number,
  timestamp?: number,
  opts?: { w: { globals: { categoryLabels: string[] } } }
) => string;

function shortMonth(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short" });
}
function shortMonthYear(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

/** Monday (UTC) de una ISO semana */
function isoWeekStart(y: number, w: number): Date {
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const jan4Dow = (jan4.getUTCDay() + 6) % 7; // 0=Mon
  const mondayW1 = new Date(jan4);
  mondayW1.setUTCDate(jan4.getUTCDate() - jan4Dow);
  const d = new Date(mondayW1);
  d.setUTCDate(mondayW1.getUTCDate() + (w - 1) * 7);
  return d;
}

/** Día: muestra solo el día (1..30), pero en el primer tick y en cambios de mes añade mes/año. */
export function makeDayTickFormatter(categories: string[]): XLabelFormatter {
  const catIndex: Record<string, number> = {};
  categories.forEach((c, i) => { catIndex[c] = i; });

  return (value) => {
    const iso = String(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
    const dt = parseISO(iso)!;
    const i = catIndex[iso] ?? -1;
    const day = String(dt.getUTCDate());

    const isFirst = i === 0;
    const isFirstOfMonth = dt.getUTCDate() === 1;
    const prevIso = i > 0 ? categories[i - 1] : null;
    const changedMonth =
      !!prevIso && prevIso.slice(0, 7) !== iso.slice(0, 7);

    if (isFirst || isFirstOfMonth || changedMonth) {
      // si es el primer tick o hay cambio de mes, mostramos dd MMM (y año si es primer tick o cambio de año)
      const withYear =
        isFirst || (!!prevIso && prevIso.slice(0, 4) !== iso.slice(0, 4));
      return withYear
        ? `${day} ${shortMonth(dt)} ${dt.getUTCFullYear()}`
        : `${day} ${shortMonth(dt)}`;
    }

    return day; // día "ligero"
  };
}

/** Semana: convierte YYYY-Www en rango "dd MMM – dd MMM (yyyy cuando cambia)". */
export function makeWeekTickFormatter(): XLabelFormatter {
  return (value) => {
    const v = String(value);
    const m = v.match(/^(\d{4})-W(\d{2})$/);
    if (!m) return v;
    const y = Number(m[1]);
    const w = Number(m[2]);

    const start = isoWeekStart(y, w);
    const end = addDays(start, 6);

    const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
    const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth();

    if (sameMonth) {
      // "12–18 ago 2025"
      return `${start.getUTCDate()}–${end.getUTCDate()} ${shortMonthYear(end)}`;
    }

    if (sameYear) {
      // "29 jul – 4 ago 2025"
      return `${start.getUTCDate()} ${shortMonth(start)} – ${end.getUTCDate()} ${shortMonthYear(end)}`;
    }

    // Cruza de año: "29 dic 2025 – 4 ene 2026"
    return `${start.getUTCDate()} ${shortMonthYear(start)} – ${end.getUTCDate()} ${shortMonthYear(end)}`;
  };
}

/** Mes: convierte YYYY-MM a "MMM yyyy". */
export function makeMonthTickFormatter(): XLabelFormatter {
  return (value) => {
    const v = String(value);
    const m = v.match(/^(\d{4})-(\d{2})$/);
    if (!m) return v;
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const dt = new Date(Date.UTC(y, mo, 1));
    return shortMonthYear(dt);
  };
}
