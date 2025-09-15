"use client";

import * as React from "react";
import type { SeriesDict } from "@/lib/mockData";
import {
  TAG_META as RAW_TAG_META,
  DEFAULT_TAG_META as RAW_DEFAULT_TAG_META,
} from "@/lib/mockData";
import { SERIES_ANALYTICS } from "@/lib/mockDataAnalytics";

// --- Tipos base ---
export type HeroIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;
export type TagMetaEntry = {
  label: string;
  icon: HeroIcon;
  color: string;
};

export type TagRow = { tag: string; total: number };

type Scope =
  | { kind: "global" } // root.<tag>
  | { kind: "pueblo"; pueblo: string }; // root.<pueblo>.<tag>

export type AnalyticsOptions = {
  pageSize?: number;
  dateFrom?: string;
  dateTo?: string;
  scope?: Scope;
  series?: SeriesDict;
  tagMeta?: Record<string, TagMetaEntry>;
  defaultTagMeta?: TagMetaEntry;
};

// --- Helpers internos ---
function sumInRange(
  byDate: Record<string, number> | undefined,
  from?: string,
  to?: string
): number {
  if (!byDate) return 0;
  let total = 0;
  for (const [d, v] of Object.entries(byDate)) {
    if (from && d < from) continue;
    if (to && d > to) continue;
    total += v || 0;
  }
  return total;
}

function datasetBounds(series: SeriesDict): { min: string | undefined; max: string | undefined } {
  let min: string | undefined;
  let max: string | undefined;
  for (const byDate of Object.values(series)) {
    for (const d of Object.keys(byDate)) {
      if (!min || d < min) min = d;
      if (!max || d > max) max = d;
    }
  }
  return { min, max };
}

// --- Hook principal ---
export function useAnalytics({
  pageSize = 8,
  dateFrom,
  dateTo,
  scope = { kind: "global" },
  series = SERIES_ANALYTICS,
  tagMeta = RAW_TAG_META as unknown as Record<string, TagMetaEntry>,
  defaultTagMeta = RAW_DEFAULT_TAG_META as unknown as TagMetaEntry,
}: AnalyticsOptions = {}) {
  const bounds = React.useMemo(() => datasetBounds(series), [series]);
  const from = dateFrom ?? bounds.min;
  const to = dateTo ?? bounds.max;

  // Todas las tags visibles
  const visibleTags = React.useMemo(() => Object.keys(tagMeta), [tagMeta]);

  // --- Función para obtener Top Tags ---
  const getTopTags = React.useCallback(() => {
    const rows: TagRow[] = [];

    for (const tag of visibleTags) {
      const key =
        scope.kind === "global"
          ? `root.${tag}`
          : `root.${scope.pueblo}.${tag}`;

      const byDate = series[key];
      const total = sumInRange(byDate, from, to);

      if (total > 0) rows.push({ tag, total });
    }

    rows.sort((a, b) => b.total - a.total);
    return rows;
  }, [visibleTags, scope, series, from, to]);

  // --- Paginación ---
  const [page, setPage] = React.useState(0);

  const allRows = getTopTags();
  const pages = Math.max(1, Math.ceil(allRows.length / pageSize));
  const sliceStart = page * pageSize;
  const sliceEnd = sliceStart + pageSize;
  const rows = allRows.slice(sliceStart, sliceEnd);

  const onPrev = React.useCallback(() => {
    setPage((p) => Math.max(0, p - 1));
  }, []);
  const onNext = React.useCallback(() => {
    setPage((p) => Math.min(pages - 1, p + 1));
  }, [pages]);

  // --- API final del hook ---
  return {
    // Para <TagsDrawer /> u otros
    rows,
    tagMeta,
    defaultTagMeta,
    page,
    pages,
    onPrev,
    onNext,

    // Funciones crudas
    getTopTags,
    allRows,

    // Info general
    scope,
    dateFrom: from,
    dateTo: to,
  };
}
