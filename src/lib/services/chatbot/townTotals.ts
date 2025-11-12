/**
 * Servicio para obtener totales + deltas de pueblos del chatbot
 *
 * Reglas (idénticas a categorías):
 * - POST dual: current + previous con granularity="d" (Mindsaic)
 * - Pattern único: "root.*.*"
 * - Totales por pueblo = solo root.<token> (profundidad 2)
 * - Mapeo de sinónimos case-insensitive
 * - Renderizar TODOS los pueblos (0 si no hay datos)
 * - null conservado (no convertir a 0)
 * - TZ = UTC, end = ayer por defecto
 * - Timeout 15s con AbortController
 */

import { ChallengeError, safeJsonFetch } from "@/lib/fetch/safeFetch";
import {
  TOWN_ID_ORDER,
  TOWN_META,
  TOWN_SYNONYMS,
  type TownId,
} from "@/lib/taxonomy/towns";
import type { WindowGranularity } from "@/lib/types";
import { computeRangesForKPI } from "@/lib/utils/time/timeWindows";
import {
  buildSynonymIndex,
  calculateDeltas,
  formatDateForMindsaic,
  normalizeForSynonymMatching,
} from "./shared/helpers";

/* ==================== Tipos ==================== */

export type TownTotalData = {
  id: TownId;
  label: string;
  iconSrc: string;
  currentTotal: number;
  prevTotal: number;
  deltaAbs: number;
  deltaPercent: number | null;
};

export type TownTotalsResponse = {
  towns: TownTotalData[];
  meta: {
    granularity: WindowGranularity;
    timezone: string;
    range: {
      current: { start: string; end: string };
      previous: { start: string; end: string };
    };
  };
  /** Opcional: respuestas crudas del origen (solo para debug) */
  raw?: {
    current: MindsaicResponse;
    previous: MindsaicResponse;
  };
};

export type FetchTownTotalsParams = {
  granularity?: WindowGranularity;
  startDate?: string | null;
  endDate?: string | null;
  db?: string;
};

export type MindsaicPoint = { time: string; value: number };
export type MindsaicOutput = Record<string, MindsaicPoint[]>;
export type MindsaicResponse = {
  code: number;
  output: MindsaicOutput;
};

/* ==================== Helpers ==================== */

/**
 * Construye índice de sinónimos para mapear tokens a TownId
 */
function buildTownSynonymIndex(): Map<string, TownId> {
  return buildSynonymIndex(TOWN_ID_ORDER, TOWN_META, TOWN_SYNONYMS);
}

/**
 * Parsea respuesta de Mindsaic y suma valores por pueblo
 * Solo cuenta claves root.<token> (profundidad 2)
 */
function parseTownTotals(
  response: MindsaicResponse,
  synonymIndex: Map<string, TownId>
): Map<TownId, number> {
  const totals = new Map<TownId, number>();

  // Inicializar todos los pueblos en 0
  for (const townId of TOWN_ID_ORDER) {
    totals.set(townId, 0);
  }

  const output = response.output || {};

  for (const [key, series] of Object.entries(output)) {
    // Solo procesar claves root.<token> (profundidad 2)
    if (!key.startsWith("root.")) continue;

    const parts = key.split(".");
    if (parts.length !== 2) continue; // Ignorar subniveles

    const token = parts[1];
    if (!token) continue;

    // Mapear token a TownId usando sinónimos
    const normalizedToken = normalizeForSynonymMatching(token);
    const townId = synonymIndex.get(normalizedToken);

    if (!townId) {
      // Token no reconocido, ignorar
      continue;
    }

    // Sumar toda la serie
    const total = series.reduce((sum, point) => sum + (point.value || 0), 0);
    const currentTotal = totals.get(townId) || 0;
    totals.set(townId, currentTotal + total);
  }

  return totals;
}

/**
 * Hace un POST a /api/chatbot/audit/tags con los parámetros dados
 */
async function fetchMindsaicData(
  startTime: string,
  endTime: string,
  db: string,
  signal: AbortSignal
): Promise<MindsaicResponse> {
  const payload = {
    db,
    patterns: "root.*.*", // Solo patrón root.<token>
    granularity: "d", // Siempre "d" para Mindsaic
    startTime,
    endTime,
  };

  try {
    const json = (await safeJsonFetch("/api/chatbot/audit/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    })) as MindsaicResponse;

    return json;
  } catch (err) {
    if (err instanceof ChallengeError) {
      // Upstream challenge — return empty response so caller can render zeros
      return { code: 200, output: {} } as MindsaicResponse;
    }
    throw err;
  }
}

/* ==================== Servicio Principal ==================== */

/**
 * Obtiene totales y deltas de todos los pueblos del chatbot
 *
 * Hace dos llamadas paralelas (current + previous) y calcula deltas.
 * Renderiza TODOS los pueblos aunque no tengan datos (0 y null).
 */
export async function fetchChatbotTownTotals(
  params: FetchTownTotalsParams = {}
): Promise<TownTotalsResponse> {
  const {
    granularity = "d",
    startDate = null,
    endDate = null,
    db = "project_huelva",
  } = params;

  // 1. Calcular rangos usando comportamiento KPI
  const ranges = computeRangesForKPI(granularity, startDate, endDate);

  // 2. Construir índice de sinónimos
  const synonymIndex = buildTownSynonymIndex();

  // 3. Formatear fechas para Mindsaic (YYYYMMDD)
  const currentStartFormatted = formatDateForMindsaic(ranges.current.start);
  const currentEndFormatted = formatDateForMindsaic(ranges.current.end);
  const prevStartFormatted = formatDateForMindsaic(ranges.previous.start);
  const prevEndFormatted = formatDateForMindsaic(ranges.previous.end);

  // 4. Hacer dos POST paralelos con timeout 15s
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const [currentResponse, prevResponse] = await Promise.all([
      fetchMindsaicData(
        currentStartFormatted,
        currentEndFormatted,
        db,
        controller.signal
      ),
      fetchMindsaicData(
        prevStartFormatted,
        prevEndFormatted,
        db,
        controller.signal
      ),
    ]);

    clearTimeout(timeoutId);

    // 5. Parsear y sumar totales por pueblo
    const currentTotals = parseTownTotals(currentResponse, synonymIndex);
    const prevTotals = parseTownTotals(prevResponse, synonymIndex);

    // 6. Construir resultado final con TODOS los pueblos
    const towns: TownTotalData[] = TOWN_ID_ORDER.map((townId) => {
      const currentTotal = currentTotals.get(townId) || 0;
      const prevTotal = prevTotals.get(townId) || 0;
      const { deltaAbs, deltaPercent } = calculateDeltas(
        currentTotal,
        prevTotal
      );

      return {
        id: townId,
        label: TOWN_META[townId].label,
        iconSrc: TOWN_META[townId].iconSrc,
        currentTotal,
        prevTotal,
        deltaAbs,
        deltaPercent,
      };
    });

    return {
      towns,
      meta: {
        granularity,
        timezone: "UTC",
        range: {
          current: ranges.current,
          previous: ranges.previous,
        },
      },
      raw: {
        current: currentResponse,
        previous: prevResponse,
      },
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Timeout al consultar pueblos del chatbot (15s)");
    }

    throw error;
  }
}
