"use client";

import type { DonutDatum, Granularity, SeriesPoint } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import {
  getUrlDrilldown,
  UrlDrilldownResponse,
} from "../services/urlDrilldown";

type Args = {
  path: string | null; // puede ser null mientras no haya selección
  granularity: Granularity;
  endISO?: string;
};

type State =
  | { loading: true; selectedPath: string | null }
  | {
      loading: false;
      selectedPath: string;
      seriesAvgEngagement: { current: SeriesPoint[]; previous: SeriesPoint[] };
      kpis: {
        current: {
          activeUsers: number;
          userEngagementDuration: number;
          newUsers: number;
          eventCount: number;
          sessions: number;
          averageSessionDuration: number;
          avgEngagementPerUser: number;
          eventsPerSession: number;
        };
        previous: {
          activeUsers: number;
          userEngagementDuration: number;
          newUsers: number;
          eventCount: number;
          sessions: number;
          averageSessionDuration: number;
          avgEngagementPerUser: number;
          eventsPerSession: number;
        };
        deltaPct: {
          activeUsers: number;
          newUsers: number;
          eventCount: number;
          sessions: number;
          averageSessionDuration: number;
          avgEngagementPerUser: number;
          eventsPerSession: number;
        };
      } | null;
      operatingSystems: DonutDatum[];
      genders: DonutDatum[];
      countries: DonutDatum[];
      deltaPct: number;
    };

export function useUrlDrilldown({ path, granularity, endISO }: Args) {
  const [state, setState] = useState<State>({
    loading: true,
    selectedPath: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Si no hay path aún, resetea a idle rápido y no llames al backend
    if (!path) {
      abortRef.current?.abort();
      setState({ loading: true, selectedPath: null });
      // opcional: podrías devolver un estado loading:false vacío si prefieres no mostrar skeleton
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setState({ loading: true, selectedPath: path });

    getUrlDrilldown({ path, granularity, endISO })
      .then((payload: UrlDrilldownResponse) => {
        if (ac.signal.aborted) return;

        setState({
          loading: false,
          selectedPath: payload.context?.path ?? path,
          seriesAvgEngagement: payload.seriesAvgEngagement,
          kpis: payload.kpis ?? null,
          operatingSystems: payload.operatingSystems ?? [],
          genders: payload.genders ?? [],
          countries: payload.countries ?? [],
          deltaPct: Number.isFinite(payload.deltaPct) ? payload.deltaPct : 0,
        });
      })
      .catch(() => {
        if (ac.signal.aborted) return;
        // En error devolvemos estructura vacía pero válida
        setState({
          loading: false,
          selectedPath: path,
          seriesAvgEngagement: { current: [], previous: [] },
          kpis: null,
          operatingSystems: [],
          genders: [],
          countries: [],
          deltaPct: 0,
        });
      });

    return () => ac.abort();
  }, [path, granularity, endISO]);

  return state;
}
