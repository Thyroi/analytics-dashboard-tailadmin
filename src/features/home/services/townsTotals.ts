// src/features/home/services/townsTotals.ts
"use client";

import {  // Endpoint estándar para "totales por municipio" - MIGRADO al nuevo endpoint
  const url = `/api/analytics/v1/dimensions/pueblos/totales?${qs}`;uildQS, fetchJSON } from "@/lib/api/analytics";
import type { Granularity } from "@/lib/types";
import type { TownId } from "@/lib/taxonomy/towns";

/** === Tipos del payload (existentes en tu proyecto) === */
export type TownTotalsItem = {
  id: TownId;
  currentTotal: number;
  previousTotal: number;
  /** Puede ser null si no hay base comparable */
  deltaPct: number | null;
};

export type TownsTotalsUIResponse = {
  granularity: Granularity;
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  property: string;
  items: TownTotalsItem[];
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

/** === Firma compatible con tu hook actual (objeto) === */
export async function getTownsTotals(params: {
  granularity: Granularity;
  /** Compat: puedes mandar endISO directo o usar `time` */
  endISO?: string;
  time?: { startISO: string; endISO: string } | { endISO?: string } | string;
  signal?: AbortSignal;
}): Promise<TownsTotalsUIResponse> {
  const { granularity, endISO, time, signal } = params;

  const norm = normalizeTimeParams(time ?? endISO);
  const qs = buildQS({
    g: granularity,
    ...(norm.start && norm.end
      ? { start: norm.start, end: norm.end }
      : norm.endOnly
      ? { end: norm.endOnly }
      : null),
  });

  // Endpoint estándar para “totales por municipio”
  const url = `/api/analytics/v1/dimensions/pueblos/totals?${qs}`;
  return fetchJSON<TownsTotalsUIResponse>(url, { signal, method: "GET" });
}
