import { buildLevel1 } from "@/lib/drilldown/level1/buildLevel1";
import type {
  BuildLevel1Result,
  RawSeriesByKey,
  SeriesPoint,
  TaxonomyCategory,
  TaxonomyTown,
} from "@/lib/drilldown/level1/buildLevel1.types";
import {
  CATEGORY_ID_ORDER,
  CATEGORY_META,
  CATEGORY_SYNONYMS,
  type CategoryId,
} from "@/lib/taxonomy/categories";
import {
  TOWN_ID_ORDER,
  TOWN_META,
  TOWN_SYNONYMS,
  type TownId,
} from "@/lib/taxonomy/towns";
import {
  fetchMindsaicTagsData,
  type MindsaicTagPoint,
} from "./shared/mindsaicV2Client";
import {
  buildCategoryPattern,
  buildTownPattern,
  getCategoryToken,
  getTownToken,
  normalizeMindsaicV2Token,
} from "./shared/v2Patterns";

export type FetchLevel1Params = {
  scopeType: "category" | "town";
  scopeId: string;
  granularity?: "d" | "w" | "m" | "y";
  startTime?: string;
  endTime?: string;
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
    level1DataPrevious?: RawSeriesByKey;
  };
};

function toSeries(points: MindsaicTagPoint[] | undefined): SeriesPoint[] {
  return (points || []).map((point) => ({
    time: point.date,
    value: point.value,
  }));
}

function buildTownEntries(): TaxonomyTown[] {
  return TOWN_ID_ORDER.map((id) => ({
    id,
    displayName: TOWN_META[id].label,
    aliases: [
      id,
      TOWN_META[id].label,
      getTownToken(id),
      ...(TOWN_SYNONYMS[id] || []),
    ],
  }));
}

function buildCategoryEntries(): TaxonomyCategory[] {
  return CATEGORY_ID_ORDER.map((id) => ({
    id,
    displayName: CATEGORY_META[id].label,
    aliases: [
      id,
      CATEGORY_META[id].label,
      getCategoryToken(id),
      ...(CATEGORY_SYNONYMS[id] || []),
    ],
  }));
}

function buildScopeToken(scopeType: "category" | "town", scopeId: string) {
  if (scopeType === "town") {
    return (TOWN_META as Record<string, unknown>)[scopeId]
      ? getTownToken(scopeId as TownId)
      : normalizeMindsaicV2Token(scopeId);
  }

  return (CATEGORY_META as Record<string, unknown>)[scopeId]
    ? getCategoryToken(scopeId as CategoryId)
    : normalizeMindsaicV2Token(scopeId);
}

function buildScopePattern(scopeType: "category" | "town", scopeId: string) {
  if (scopeType === "town") {
    if ((TOWN_META as Record<string, unknown>)[scopeId]) {
      return buildTownPattern(scopeId as TownId);
    }
    return `${normalizeMindsaicV2Token(scopeId)}.*`;
  }

  if ((CATEGORY_META as Record<string, unknown>)[scopeId]) {
    return buildCategoryPattern(scopeId as CategoryId);
  }
  return `*.${normalizeMindsaicV2Token(scopeId)}`;
}

export async function fetchLevel1Drilldown(
  params: FetchLevel1Params,
): Promise<FetchLevel1Response> {
  const granularity = params.granularity ?? "d";
  const db = params.db ?? "huelva";

  const startTime = params.startTime;
  if (!startTime) {
    throw new Error("startTime es obligatorio para Level1");
  }

  const towns = buildTownEntries();
  const categories = buildCategoryEntries();
  const scopeToken = buildScopeToken(params.scopeType, params.scopeId);
  const pattern = buildScopePattern(params.scopeType, params.scopeId);

  if (!pattern) {
    return {
      donutData: [],
      seriesBySlice: {},
      otrosDetail: [],
      sublevelMap: {},
      total: 0,
      warnings: [],
      scopeType: params.scopeType,
      scopeId: params.scopeId,
      meta: {
        granularity,
        range: { start: params.startTime, end: params.endTime },
        db,
      },
    };
  }

  const response = await fetchMindsaicTagsData({
    patterns: [pattern],
    startTime,
    endTime: params.endTime,
    id: db,
  });

  const output = response.output?.[pattern];
  const dataMap = output?.data || {};
  const prevMap = output?.previous || {};

  const level1DataCurrent: RawSeriesByKey = Object.fromEntries(
    Object.entries(dataMap).map(([key, series]) => [
      `root.${scopeToken}.${key}`,
      toSeries(series),
    ]),
  );

  const level1DataPrevious: RawSeriesByKey | undefined = Object.keys(prevMap)
    .length
    ? Object.fromEntries(
        Object.entries(prevMap).map(([key, series]) => [
          `root.${scopeToken}.${key}`,
          toSeries(series),
        ]),
      )
    : undefined;

  const scopeTotalSeries: SeriesPoint[] =
    Object.values(level1DataCurrent).flat();

  const fetchMany = async (patterns: string[]): Promise<RawSeriesByKey> => {
    if (patterns.length === 0) return {};

    const mapping = patterns.map((rootPattern) => {
      const parts = rootPattern.split(".");
      const childToken = parts[2] ?? "";
      const v2Pattern =
        params.scopeType === "town"
          ? `${scopeToken}.${childToken}`
          : `${childToken}.${scopeToken}`;
      return { rootPattern, childToken, v2Pattern };
    });

    const responseMany = await fetchMindsaicTagsData({
      patterns: mapping.map((m) => m.v2Pattern),
      startTime,
      endTime: params.endTime,
      id: db,
    });

    const result: RawSeriesByKey = {};
    for (const { v2Pattern, childToken } of mapping) {
      const outputEntry = responseMany.output?.[v2Pattern];
      const childDataMap = outputEntry?.data || {};
      for (const [tagId, series] of Object.entries(childDataMap)) {
        result[`root.${scopeToken}.${childToken}.${tagId}`] = toSeries(series);
      }
    }

    return result;
  };

  const result = await buildLevel1({
    scopeType: params.scopeType,
    scopeId: scopeToken,
    level1Data: level1DataCurrent,
    towns,
    categories,
    sumStrategy: params.sumStrategy ?? "sum",
    fetchMany,
    scopeTotalSeries,
    debug: params.debug,
  });

  return {
    ...result,
    scopeType: params.scopeType,
    scopeId: params.scopeId,
    meta: {
      granularity,
      range: { start: params.startTime, end: params.endTime },
      db,
    },
    raw: {
      level1DataPrevious,
    },
  };
}
