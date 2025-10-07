// src/features/home/services/categoriesTotals.ts
"use client";

import { buildQS, fetchJSON } from "@/lib/api/analytics";
import type { Granularity } from "@/lib/types";
import type { CategoryId } from "@/lib/taxonomy/categories";

/** === Tipos del payload (existentes en tu proyecto) === */
export type CategoryTotalsItem = {
  id: CategoryId;
  title: string;
  total: number;
  /** Puede ser null si no hay base comparable */
  deltaPct: number | null;
};

export type CategoriesTotalsResponse = {
  granularity: Granularity;
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  property: string;
  items: CategoryTotalsItem[];
};

/** === Parámetros de tiempo (nuevo) === */
export type TimeParams =
  | { startISO: string; endISO: string }
  | { endISO?: string }
  | string
  | undefined;

/** Normaliza el parámetro de tiempo para QS */
function normalizeTimeParams(time?: TimeParams): {
  start?: string;
  end?: string;
  endOnly?: string;
} {
  if (typeof time === "string") {
    return { endOnly: time };
  }
  if (!time) {
    return {};
  }
  if ("startISO" in time && "endISO" in time) {
    return { start: time.startISO, end: time.endISO };
  }
  return { endOnly: time.endISO };
}

/** === Overloads para compatibilidad con el hook actual === */
export async function getCategoriesTotals(
  granularity: Granularity,
  endISO?: string,
  signal?: AbortSignal
): Promise<CategoriesTotalsResponse>;
export async function getCategoriesTotals(
  granularity: Granularity,
  time?: { startISO: string; endISO: string } | { endISO?: string } | string,
  signal?: AbortSignal
): Promise<CategoriesTotalsResponse>;
export async function getCategoriesTotals(
  granularity: Granularity,
  timeOrEndISO?: TimeParams,
  signal?: AbortSignal
): Promise<CategoriesTotalsResponse> {
  const { start, end, endOnly } = normalizeTimeParams(timeOrEndISO);

  const qs = buildQS({
    g: granularity,
    ...(start && end
      ? { start, end }
      : endOnly
      ? { end: endOnly }
      : null),
  });

  // Endpoint estándar para “totales por categoría”
  const url = `/api/analytics/v1/dimensions/categorias/totals?${qs}`;
  return fetchJSON<CategoriesTotalsResponse>(url, { signal, method: "GET" });
}
