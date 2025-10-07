"use client";

import {
  getTownCategoryDrilldown,
  type SubSeries,
  type TownCategoryDrilldownResponse,
} from "@/features/analytics/services/drilldown";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, Granularity } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

type Ready = {
  loading: false;
  xLabels: string[];
  seriesByUrl: SubSeries[];
  donut: DonutDatum[];
  deltaPct: number;
};

type Pending = { loading: true };

export function useTownCategoryDrilldown(args: {
  townId: TownId;
  categoryId: CategoryId;
  granularity: Granularity;
  endISO?: string;
}) {
  const { townId, categoryId, granularity, endISO } = args;

  const [state, setState] = useState<Ready | Pending>({ loading: true });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setState({ loading: true });

    getTownCategoryDrilldown({ townId, categoryId, granularity, endISO })
      .then((res: TownCategoryDrilldownResponse) => {
        if (ac.signal.aborted) return;
        const donut: DonutDatum[] = (res.donut ?? []).map((d) => ({
          label: d.label,
          value: d.value,
        }));
        setState({
          loading: false,
          xLabels: res.xLabels ?? [],
          seriesByUrl: res.seriesByUrl ?? [],
          donut,
          deltaPct: Number.isFinite(res.deltaPct) ? res.deltaPct : 0,
        });
      })
      .catch(() => {
        if (ac.signal.aborted) return;
        setState({
          loading: false,
          xLabels: [],
          seriesByUrl: [],
          donut: [],
          deltaPct: 0,
        });
      });

    return () => ac.abort();
  }, [townId, categoryId, granularity, endISO]);

  return {
    loading: state.loading,
    xLabels: !state.loading ? state.xLabels : [],
    seriesByUrl: !state.loading ? state.seriesByUrl : [],
    donut: !state.loading ? state.donut : [],
    deltaPct: !state.loading ? state.deltaPct : 0,
  };
}
