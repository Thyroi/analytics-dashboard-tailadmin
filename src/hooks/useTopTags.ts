"use client";

import * as React from "react";
import { SERIES } from "@/lib/mockData";
import { datesForGranularity, computeTop, type Granularity } from "@/lib/chatbot/tags";

export function useTopTags(pageSize = 5, initialGran: Granularity = "day") {
  const [gran, setGran] = React.useState<Granularity>(initialGran);
  const [page, setPage] = React.useState(0);

  const dates = React.useMemo(() => datesForGranularity(SERIES, gran), [gran]);
  const rows  = React.useMemo(() => computeTop(SERIES, dates), [dates]);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const start = page * pageSize;
  const view  = rows.slice(start, start + pageSize);

  React.useEffect(() => setPage(0), [gran]);

  const next = () => setPage((p) => Math.min(pages - 1, p + 1));
  const prev = () => setPage((p) => Math.max(0, p - 1));

  const rangeLabel = gran === "day" ? "Último día" : gran === "week" ? "Últimos 7 días" : "Últimos 30 días";

  return { gran, setGran, page, setPage, pages, view, rangeLabel, next, prev };
}
export type { Granularity };
