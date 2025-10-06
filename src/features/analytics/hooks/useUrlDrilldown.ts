"use client";

import {
  getUrlDrilldown,
  type UrlDrilldownResponse,
} from "@/features/analytics/services/urlDrilldown";
import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ReadyData = {
  seriesAvgEngagement: { current: SeriesPoint[]; previous: SeriesPoint[] };
  kpis: UrlDrilldownResponse["kpis"];
  operatingSystems: DonutDatum[];
  genders: DonutDatum[];
  countries: DonutDatum[];
  deltaPct: number;
  path: string;
};

type State =
  | { status: "idle" | "loading" }
  | { status: "ready"; data: ReadyData }
  | { status: "error"; message: string };

export function useUrlDrilldown(args: {
  path: string | null;
  granularity: Granularity;
  endISO?: string;
  auto?: boolean;
}) {
  const { path, granularity, endISO, auto = true } = args;
  const [state, setState] = useState<State>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  const key = useMemo(
    () => `${path ?? ""}|${granularity}|${endISO ?? ""}`,
    [path, granularity, endISO]
  );

  const load = useCallback(async () => {
    if (!path) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setState({ status: "loading" });
    try {
      const resp: UrlDrilldownResponse = await getUrlDrilldown({
        path,
        granularity,
        endISO,
        signal: ac.signal,
        dayAsWeek: granularity === "d", // 👈 activar semana para “Día”
      });
      if (ac.signal.aborted) return;
      setState({
        status: "ready",
        data: {
          seriesAvgEngagement: resp.seriesAvgEngagement,
          kpis: resp.kpis,
          operatingSystems: resp.operatingSystems,
          genders: resp.genders,
          countries: resp.countries,
          deltaPct: resp.deltaPct,
          path: resp.context.path,
        },
      });
    } catch (e) {
      if (ac.signal.aborted) return;
      setState({
        status: "error",
        message: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }, [path, granularity, endISO]);

  useEffect(() => {
    if (!auto || !path) return;
    void load();
    return () => abortRef.current?.abort();
  }, [auto, key, load, path]);

  const loading = state.status === "loading";
  const seriesAvgEngagement =
    state.status === "ready"
      ? state.data.seriesAvgEngagement
      : { current: [], previous: [] };
  const kpis = state.status === "ready" ? state.data.kpis : null;
  const operatingSystems =
    state.status === "ready" ? state.data.operatingSystems : [];
  const genders = state.status === "ready" ? state.data.genders : [];
  const countries = state.status === "ready" ? state.data.countries : [];
  const deltaPct = state.status === "ready" ? state.data.deltaPct : 0;
  const selectedPath = state.status === "ready" ? state.data.path : null;

  return {
    state,
    loading,
    seriesAvgEngagement,
    kpis,
    operatingSystems,
    genders,
    countries,
    deltaPct,
    selectedPath,
    refetch: load,
  };
}
