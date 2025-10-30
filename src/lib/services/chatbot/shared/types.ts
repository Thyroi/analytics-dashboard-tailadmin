/**
 * Tipos compartidos para servicios de chatbot breakdown
 */

import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { SeriesPoint, WindowGranularity } from "@/lib/types";
import type { OTHERS_ID } from "../partition";

/* ==================== Respuestas de Mindsaic ==================== */

export type MindsaicPoint = { time: string; value: number };
export type MindsaicOutput = Record<string, MindsaicPoint[]>;
export type MindsaicResponse = {
  code: number;
  output: MindsaicOutput;
};

/* ==================== Breakdown Entries ==================== */

export type OthersBreakdownEntry = {
  key: string; // Clave original, e.g., "root.patrimonio.paterna.tejada la nueva"
  path: string[]; // Parts splitteadas, e.g., ["root", "patrimonio", "paterna", "tejada la nueva"]
  value: number; // Valor agregado (suma de todas las series)
  timePoints: Array<{ time: string; value: number }>; // Puntos individuales para debugging
};

/* ==================== Town Category Breakdown ==================== */

export type TownCategoryData = {
  categoryId: CategoryId | typeof OTHERS_ID;
  label: string;
  iconSrc: string;
  currentTotal: number;
  prevTotal: number;
  deltaAbs: number;
  deltaPercent: number | null;
};

export type TownCategoryBreakdownResponse = {
  townId: TownId;
  categories: TownCategoryData[];
  seriesByCategory?: Record<string, Array<{ time: string; value: number }>>; // Opcional para futura comparativa
  /** Series agregadas por día para el pueblo completo (para la gráfica de la izquierda) */
  series?: {
    current: SeriesPoint[];
    previous: SeriesPoint[];
  };
  /** Raw segments observed grouped by canonical CategoryId with totals (to pick representative raw segment for Nivel 2) */
  categoryRawSegmentsById?: Record<CategoryId, Record<string, number>>;
  /** Desglose de claves que cayeron en "Otros" (no mapeables) */
  othersBreakdown?: {
    current: OthersBreakdownEntry[];
    previous: OthersBreakdownEntry[];
  };
  meta: {
    granularity: WindowGranularity;
    timezone: string;
    range: {
      current: { start: string; end: string };
      previous: { start: string; end: string };
    };
  };
  /** Opcional: respuestas crudas del origen (solo para debug del nivel 1) */
  raw?: {
    current: MindsaicResponse;
    previous: MindsaicResponse;
  };
};

export type FetchTownCategoryBreakdownParams = {
  townId: TownId;
  startISO?: string | null;
  endISO?: string | null;
  windowGranularity?: WindowGranularity;
  db?: string;
};

/* ==================== Category Town Breakdown ==================== */

export type CategoryTownData = {
  townId: TownId | typeof OTHERS_ID;
  label: string;
  iconSrc: string;
  currentTotal: number;
  prevTotal: number;
  deltaAbs: number;
  deltaPercent: number | null;
};

export type CategoryTownBreakdownResponse = {
  categoryId: CategoryId;
  towns: CategoryTownData[];
  seriesByTown?: Record<string, Array<{ time: string; value: number }>>;
  series?: {
    current: SeriesPoint[];
    previous: SeriesPoint[];
  };
  townRawSegmentsById?: Record<TownId, Record<string, number>>;
  othersBreakdown?: {
    current: OthersBreakdownEntry[];
    previous: OthersBreakdownEntry[];
  };
  meta: {
    granularity: WindowGranularity;
    timezone: string;
    range: {
      current: { start: string; end: string };
      previous: { start: string; end: string };
    };
  };
  raw?: {
    current: MindsaicResponse;
    previous: MindsaicResponse;
  };
};

export type FetchCategoryTownBreakdownParams = {
  categoryId: CategoryId;
  startISO?: string | null;
  endISO?: string | null;
  windowGranularity?: WindowGranularity;
  db?: string;
  /** Optional: representative raw segment token for the category */
  representativeCategoryRaw?: string | null;
};
