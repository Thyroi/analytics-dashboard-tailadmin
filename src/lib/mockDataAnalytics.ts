// src/lib/mockDataAnalytics.ts
// =====================================================
//  Mock de analítica basado en la estructura real de
//  mockData.ts: usa los 18 PUEBLOS y los 12 VISIBLE_TAG_SPECS.
//  Genera hojas (URLs) por (pueblo → tag → subtag) y
//  propaga visitas hacia root / tag / pueblo / combinaciones.
// =====================================================

import type { SeriesDict } from "./mockData";
import { PUEBLOS, VISIBLE_TAG_SPECS } from "./mockData";

// Mantén este rango alineado con mockData.ts (mismos valores)
const START = "2025-05-01";
const END = "2025-08-31";

// Dominio base para URLs de hojas
const BASE_URL = "https://www.contadohuelva.es";

// --------------------------------------------
// Utilidades deterministas / fechas
function hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
function dateRangeDays(startISO: string, endISO: string): string[] {
  const out: string[] = [];
  const d0 = new Date(startISO + "T00:00:00Z");
  const d1 = new Date(endISO + "T00:00:00Z");
  for (let d = new Date(d0); d <= d1; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}
const DATES = dateRangeDays(START, END);

// --------------------------------------------
// Estructura de leaves y helpers de clave/URL
export type Leaf = {
  pueblo: string;
  tag: string;
  subtag?: string;
  slug: string;
};

function slugify(s: string): string {
  return s
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildLeafURL(l: Leaf): string {
  const parts = [BASE_URL, l.pueblo, l.tag];
  if (l.subtag) parts.push(l.subtag);
  parts.push(l.slug);
  return parts.join("/").replace(/\/+/g, "/");
}

function leafKey(l: Leaf): string {
  const parts = ["root", l.pueblo, l.tag];
  if (l.subtag) parts.push(l.subtag);
  parts.push(l.slug);
  return parts.join(".");
}

// --------------------------------------------
// Cobertura determinista (no todos los pueblos tienen todos los tags)
// Puedes ajustar probabilidades por tag si quieres esparsidad variable.
const COVERAGE_BY_TAG_DEFAULT = 0.78;
const COVERAGE_BY_TAG_PARTICULAR: Record<string, number> = {
  // Algunos ejemplos razonables:
  playa: 0.38,              // No todos los pueblos tienen playa
  circuitoMonteblanco: 0.25,
  rutasCulturales: 0.65,
  rutasSenderismo: 0.85,
};

function hasPair(pueblo: string, tag: string): boolean {
  const r = mulberry32(hashStr(`cover:${pueblo}:${tag}`))();
  const p = COVERAGE_BY_TAG_PARTICULAR[tag] ?? COVERAGE_BY_TAG_DEFAULT;
  return r < p;
}

// Número de leaves por (pueblo, tag, subtag), determinista y pequeño (0–3)
function leavesCountFor(pueblo: string, tag: string, subtag: string): number {
  const r = mulberry32(hashStr(`leaves:${pueblo}:${tag}:${subtag}`))();
  // Sesgo: 0/1/2/3 con más probabilidad en 1–2
  if (r < 0.18) return 0;
  if (r < 0.58) return 1;
  if (r < 0.90) return 2;
  return 3;
}

// Construye slugs “bonitos” por índice
function leafSlugFor(pueblo: string, tag: string, subtag: string, i: number): string {
  // p.ej. "mirador-1-almonte", "mirador-2-almonte"
  const base = slugify(subtag || "item");
  return `${base}-${i + 1}-${slugify(pueblo)}`;
}

// --------------------------------------------
// Generación de leaves a partir de PUEBLOS + VISIBLE_TAG_SPECS
export function buildLeavesFromSpecs(): Leaf[] {
  const leaves: Leaf[] = [];
  for (const { id: tag, subtags } of VISIBLE_TAG_SPECS) {
    for (const pueblo of PUEBLOS) {
      if (!hasPair(pueblo, tag)) continue; // este pueblo no expone este tag
      for (const subtag of subtags) {
        const n = leavesCountFor(pueblo, tag, subtag);
        for (let i = 0; i < n; i++) {
          leaves.push({
            pueblo,
            tag,
            subtag,
            slug: leafSlugFor(pueblo, tag, subtag, i),
          });
        }
      }
    }
  }
  return leaves;
}

// --------------------------------------------
// Serie diaria por leaf (determinista, con estacionalidad suave)
function buildLeafDaily(key: string, bias: number = 1): Record<string, number> {
  const rnd = mulberry32(hashStr(`leaf:${key}`));
  const amp = 0.35 + rnd() * 0.25; // 0.35–0.60
  const phase = rnd() * Math.PI * 2;
  const base = Math.round(6 * bias + rnd() * 6 * bias); // ~6–12 * bias
  const out: Record<string, number> = {};

  DATES.forEach((date, i) => {
    const season = Math.sin(i / 18 + phase); // ciclo ~36d
    const dow = new Date(date + "T00:00:00Z").getUTCDay();
    const weekend = (dow === 0 || dow === 6) ? 1.18 : 1.0;
    const noise = 0.9 + rnd() * 0.2; // 0.9–1.1
    let v = base * (1 + amp * season) * weekend * noise;
    if (v < 0) v = 0;
    out[date] = Math.max(0, Math.round(v));
  });
  return out;
}

// --------------------------------------------
// Helpers de series
function ensureKey(series: SeriesDict, key: string) {
  if (!series[key]) series[key] = {};
}
function addDaily(series: SeriesDict, key: string, date: string, delta: number) {
  ensureKey(series, key);
  series[key][date] = (series[key][date] || 0) + delta;
}

// Propagación: leaf → (root, tag, pueblo, pueblo.tag) y si hay subtag → (tag.subtag, pueblo.tag.subtag)
function propagate(series: SeriesDict, leaf: Leaf, date: string, value: number) {
  const kLeaf = leafKey(leaf);
  addDaily(series, kLeaf, date, value);
  addDaily(series, "root", date, value);
  addDaily(series, `root.${leaf.tag}`, date, value);
  addDaily(series, `root.${leaf.pueblo}`, date, value);
  addDaily(series, `root.${leaf.pueblo}.${leaf.tag}`, date, value);
  if (leaf.subtag) {
    addDaily(series, `root.${leaf.tag}.${leaf.subtag}`, date, value);
    addDaily(series, `root.${leaf.pueblo}.${leaf.tag}.${leaf.subtag}`, date, value);
  }
}

// --------------------------------------------
// Construcción principal (todo nace en leaves)
export function buildAnalyticsSeries(leaves: Leaf[]): SeriesDict {
  const series: SeriesDict = {};
  // Pre-asegura nodos padres básicos (opcional)
  ensureKey(series, "root");
  for (const { id: tag, subtags } of VISIBLE_TAG_SPECS) {
    ensureKey(series, `root.${tag}`);
    for (const pueblo of PUEBLOS) {
      ensureKey(series, `root.${pueblo}`);
      ensureKey(series, `root.${pueblo}.${tag}`);
      for (const subtag of subtags) {
        ensureKey(series, `root.${tag}.${subtag}`);
        ensureKey(series, `root.${pueblo}.${tag}.${subtag}`);
      }
    }
  }

  // Genera visitas por leaf y propaga
  for (const leaf of leaves) {
    const key = leafKey(leaf);
    const bias =
      leaf.tag === "naturaleza" ? 1.0 :
      leaf.tag === "playa" ? 0.9 :
      1.0;
    const daily = buildLeafDaily(key, bias);
    for (const d of DATES) {
      const v = daily[d] || 0;
      if (v > 0) propagate(series, leaf, d, v);
    }
  }

  return series;
}

// --------------------------------------------
// Export listo para usar
export const LEAVES_GENERATED: Leaf[] = buildLeavesFromSpecs();
export const SERIES_ANALYTICS: SeriesDict = buildAnalyticsSeries(LEAVES_GENERATED);
export const URLS_BY_LEAF: Record<string, string> = Object.fromEntries(
  LEAVES_GENERATED.map((l) => [leafKey(l), buildLeafURL(l)])
);

// Helpers
export function totalFor(key: string, series: SeriesDict = SERIES_ANALYTICS): number {
  const days = series[key] || {};
  return Object.values(days).reduce((a, b) => a + b, 0);
}
export function getLastDate(series: SeriesDict = SERIES_ANALYTICS): string {
  let last = "";
  for (const byDate of Object.values(series)) {
    for (const d of Object.keys(byDate)) {
      if (d > last) last = d;
    }
  }
  return last;
}
export function listKeys(prefix = "root", series: SeriesDict = SERIES_ANALYTICS): string[] {
  return Object.keys(series).filter((k) => k === prefix || k.startsWith(prefix + ".")).sort();
}
