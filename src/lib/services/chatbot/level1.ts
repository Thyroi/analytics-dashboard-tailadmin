import { buildLevel1 } from "@/lib/drilldown/level1/buildLevel1";
import type {
  BuildLevel1Result,
  RawSeriesByKey,
  TaxonomyCategory,
  TaxonomyTown,
} from "@/lib/drilldown/level1/buildLevel1.types";
import { ChallengeError, safeJsonFetch } from "@/lib/fetch/safeFetch";
import {
  CATEGORY_META,
  CATEGORY_SYNONYMS,
  CHATBOT_CATEGORY_NEEDS_WILDCARD,
  CHATBOT_CATEGORY_TOKENS,
  type CategoryId,
} from "@/lib/taxonomy/categories";
import {
  CHATBOT_TOWN_NEEDS_WILDCARD,
  CHATBOT_TOWN_TOKENS,
  TOWN_META,
  TOWN_SYNONYMS,
  type TownId,
} from "@/lib/taxonomy/towns";
import { computeRangesForSeries } from "@/lib/utils/time/timeWindows";

export type FetchLevel1Params = {
  scopeType: "category" | "town";
  scopeId: string; // token as appears in data, e.g., "naturaleza" or "la palma del condado"
  granularity?: "d" | "w" | "m" | "y";
  startTime?: string; // YYYYMMDD
  endTime?: string; // YYYYMMDD
  db?: string;
  sumStrategy?: "sum" | "last";
  debug?: boolean;
};

export type FetchLevel1Response = BuildLevel1Result & {
  scopeType: "category" | "town";
  scopeId: string;
  meta: {
    granularity: "d" | "w" | "m" | "y";
    range?: { start?: string; end?: string };
    db: string;
  };
  raw?: {
    level1Data: RawSeriesByKey;
    level1DataPrevious?: RawSeriesByKey; // Datos del rango previo para comparación
    // Optionally include children map for debugging
    // childrenData?: RawSeriesByKey;
  };
};

function buildTownEntries(): TaxonomyTown[] {
  const towns: TaxonomyTown[] = (Object.keys(TOWN_META) as TownId[]).map(
    (id) => {
      const meta = TOWN_META[id];
      const aliases = new Set<string>();
      // include synonyms and official label
      (TOWN_SYNONYMS[id] || []).forEach((a) => aliases.add(a));
      aliases.add(meta.label);
      aliases.add(id); // e.g., "laPalmaDelCondado" (will be normalized on compare)
      return {
        id, // keep canonical app ID (camelCase)
        displayName: meta.label,
        aliases: Array.from(aliases),
      } as TaxonomyTown;
    }
  );
  return towns;
}

function buildCategoryEntries(): TaxonomyCategory[] {
  const categories: TaxonomyCategory[] = (
    Object.keys(CATEGORY_META) as CategoryId[]
  ).map((id) => {
    const meta = CATEGORY_META[id];
    const aliases = new Set<string>();
    (CATEGORY_SYNONYMS[id] || []).forEach((a) => aliases.add(a));
    aliases.add(meta.label);
    aliases.add(id);
    return {
      id, // keep canonical app ID (camelCase)
      displayName: meta.label,
      aliases: Array.from(aliases),
    } as TaxonomyCategory;
  });
  return categories;
}

async function fetchManyAPI(
  patterns: string[],
  options: {
    granularity: "d" | "w" | "m" | "y";
    startTime?: string;
    endTime?: string;
    db: string;
  }
): Promise<RawSeriesByKey> {
  // Single POST with array of patterns, API supports 'patterns'
  const payload = {
    db: options.db,
    patterns, // array of patterns for batch
    // Always query Mindsaic with daily granularity; UI granularity only affects presentation
    granularity: "d" as const,
    ...(options.startTime && { startTime: options.startTime }),
    ...(options.endTime && { endTime: options.endTime }),
  };

  // Use safeJsonFetch instead of raw fetch to detect upstream HTML challenges
  try {
    const json = (await safeJsonFetch("/api/chatbot/audit/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })) as unknown;

    let output: unknown = {};
    if (json && typeof json === "object") {
      const j = json as Record<string, unknown>;
      output = j.output ?? j.data ?? {};
    }

    return output as RawSeriesByKey;
  } catch (err) {
    if (err instanceof ChallengeError) return {} as RawSeriesByKey;
    throw err;
  }
}

async function fetchLevel1Data(
  scopeType: "category" | "town",
  scopeId: string,
  options: {
    granularity: "d" | "w" | "m" | "y";
    startTime?: string;
    endTime?: string;
    db: string;
  }
): Promise<RawSeriesByKey> {
  // CRITICAL: Convert app ID to RAW token as it appears in data
  // scopeId might be "fiestasTradiciones" (app ID) but data has "fiestas y tradiciones"
  let scopeTokenForPattern = scopeId;

  if (
    scopeType === "category" &&
    (CATEGORY_META as Record<string, unknown>)[scopeId]
  ) {
    const categoryId = scopeId as CategoryId;
    const rawToken = CHATBOT_CATEGORY_TOKENS[categoryId];
    // Verificar si esta categoría necesita wildcard (excepción)
    const needsWildcard = CHATBOT_CATEGORY_NEEDS_WILDCARD.has(categoryId);
    scopeTokenForPattern = needsWildcard ? `${rawToken}*` : rawToken;
  }

  if (
    scopeType === "town" &&
    (TOWN_META as Record<string, unknown>)[scopeId as TownId]
  ) {
    const townId = scopeId as TownId;
    const rawToken = CHATBOT_TOWN_TOKENS[townId];
    // Verificar si este pueblo necesita wildcard (excepción)
    const needsWildcard = CHATBOT_TOWN_NEEDS_WILDCARD.has(townId);
    scopeTokenForPattern = needsWildcard ? `${rawToken}*` : rawToken;
  }

  const pattern = `root.${scopeTokenForPattern}.*`;

  const payload = {
    db: options.db,
    patterns: pattern,
    // Always use daily for backend API; UI granularity is handled at aggregation layer
    granularity: "d" as const,
    ...(options.startTime && { startTime: options.startTime }),
    ...(options.endTime && { endTime: options.endTime }),
  };

  try {
    const json = (await safeJsonFetch("/api/chatbot/audit/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })) as unknown;

    let output: unknown = {};
    if (json && typeof json === "object") {
      const j = json as Record<string, unknown>;
      output = j.output ?? j.data ?? {};
    }

    return output as RawSeriesByKey;
  } catch (err) {
    if (err instanceof ChallengeError) return {} as RawSeriesByKey;
    throw err;
  }
}

export async function fetchLevel1Drilldown(
  params: FetchLevel1Params
): Promise<FetchLevel1Response> {
  const granularity = params.granularity ?? "d";
  const db = params.db ?? "project_huelva";

  const [towns, categories] = [buildTownEntries(), buildCategoryEntries()];

  // CRITICAL: Convert scopeId (app ID) to RAW token for API queries
  let scopeTokenRaw = params.scopeId;

  if (
    params.scopeType === "category" &&
    (CATEGORY_META as Record<string, unknown>)[params.scopeId]
  ) {
    const categoryId = params.scopeId as CategoryId;
    const rawToken = CHATBOT_CATEGORY_TOKENS[categoryId];
    // Verificar si esta categoría necesita wildcard (excepción)
    const needsWildcard = CHATBOT_CATEGORY_NEEDS_WILDCARD.has(categoryId);
    scopeTokenRaw = needsWildcard ? `${rawToken}*` : rawToken;
  }

  if (
    params.scopeType === "town" &&
    (TOWN_META as Record<string, unknown>)[params.scopeId as TownId]
  ) {
    const townId = params.scopeId as TownId;
    const rawToken = CHATBOT_TOWN_TOKENS[townId];
    // Verificar si este pueblo necesita wildcard (excepción)
    const needsWildcard = CHATBOT_TOWN_NEEDS_WILDCARD.has(townId);
    scopeTokenRaw = needsWildcard ? `${rawToken}*` : rawToken;
  }

  // Calcular rangos current/previous si tenemos startTime y endTime
  let startTimeCurrent: string | undefined = params.startTime;
  let endTimeCurrent: string | undefined = params.endTime;
  let startTimePrevious: string | undefined;
  let endTimePrevious: string | undefined;

  if (params.startTime && params.endTime) {
    // Convertir YYYYMMDD → YYYY-MM-DD para computeRangesForSeries
    const startISO = `${params.startTime.slice(0, 4)}-${params.startTime.slice(
      4,
      6
    )}-${params.startTime.slice(6, 8)}`;
    const endISO = `${params.endTime.slice(0, 4)}-${params.endTime.slice(
      4,
      6
    )}-${params.endTime.slice(6, 8)}`;

    const ranges = computeRangesForSeries(granularity, startISO, endISO);

    // Convertir de vuelta a YYYYMMDD
    startTimeCurrent = ranges.current.start.replace(/-/g, "");
    endTimeCurrent = ranges.current.end.replace(/-/g, "");
    startTimePrevious = ranges.previous.start.replace(/-/g, "");
    endTimePrevious = ranges.previous.end.replace(/-/g, "");
  }

  // ESTRATEGIA: Hacer DOS POST en paralelo (más eficiente)
  // - POST 1: current period
  // - POST 2: previous period
  const [level1DataCurrent, level1DataPrevious] = await Promise.all([
    fetchLevel1Data(params.scopeType, params.scopeId, {
      db,
      granularity,
      startTime: startTimeCurrent,
      endTime: endTimeCurrent,
    }),
    startTimePrevious && endTimePrevious
      ? fetchLevel1Data(params.scopeType, params.scopeId, {
          db,
          granularity,
          startTime: startTimePrevious,
          endTime: endTimePrevious,
        })
      : Promise.resolve({} as RawSeriesByKey),
  ]);

  const result = await buildLevel1({
    scopeType: params.scopeType,
    // CRITICAL: Use RAW token for child pattern construction (not app ID)
    scopeId: scopeTokenRaw,
    level1Data: level1DataCurrent,
    towns,
    categories,
    sumStrategy: params.sumStrategy ?? "sum",
    fetchMany: (patterns) =>
      fetchManyAPI(patterns, {
        db,
        granularity,
        startTime: startTimeCurrent,
        endTime: endTimeCurrent,
      }),
    debug: params.debug,
  });

  return {
    ...result,
    scopeType: params.scopeType,
    scopeId: params.scopeId,
    meta: {
      granularity,
      range: { start: startTimeCurrent, end: endTimeCurrent },
      db,
    },
    raw: {
      level1Data: level1DataCurrent,
      level1DataPrevious,
    },
  };
}
