"use client";

import { fetchJSON } from "@/lib/api/analytics";
import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { DonutDatum, Granularity } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

// Base response structure that both endpoints share
type DrilldownResponse = {
  granularity: Granularity;
  range: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  property: string;
  id: string;
  title: string;
  series: {
    current: { label: string; value: number }[];
    previous: { label: string; value: number }[];
  };
  donutData: { label: string; value: number }[];
  deltaPct: number;
};

type Ready = {
  loading: false;
  response: DrilldownResponse;
  donut: DonutDatum[];
  deltaPct: number;
};

type Pending = { loading: true };

type DrilldownConfig =
  | {
      type: "pueblo-category";
      townId: TownId;
      categoryId: CategoryId;
    }
  | {
      type: "category-pueblo";
      categoryId: CategoryId;
      townId: TownId;
    };

export function useDrilldownDetails(
  config: DrilldownConfig & {
    granularity: Granularity;
    endISO?: string;
    startISO?: string; // Nueva propiedad opcional
  }
): Ready | Pending {
  const { granularity, endISO, startISO, ...drilldownConfig } = config;

  // Build query key and URL based on drilldown type
  let url: string;
  const qs = new URLSearchParams({ granularity });

  // Si tenemos tanto startISO como endISO, usar ambos
  if (startISO && endISO) {
    qs.set("startDate", startISO);
    qs.set("endDate", endISO);
  } else if (endISO) {
    // Usar solo endDate para compatibilidad con el comportamiento original
    qs.set("endDate", endISO);
  }

  if (drilldownConfig.type === "pueblo-category") {
    // Query pueblo endpoint with category filter
    qs.set("categoryId", drilldownConfig.categoryId);
    url = `/api/analytics/v1/dimensions/pueblos/details/${
      drilldownConfig.townId
    }?${qs.toString()}`;
  } else {
    // Query categoria endpoint with town filter
    qs.set("townId", drilldownConfig.townId);
    url = `/api/analytics/v1/dimensions/categorias/details/${
      drilldownConfig.categoryId
    }?${qs.toString()}`;
  }

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "drilldown-details",
      drilldownConfig.type,
      drilldownConfig.townId,
      drilldownConfig.categoryId,
      granularity,
      endISO,
    ],
    queryFn: async (): Promise<DrilldownResponse> => {
      return fetchJSON<DrilldownResponse>(url);
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: (failureCount, error) => {
      if (error instanceof Error && error.name === "AbortError") return false;
      return failureCount < 2;
    },
  });

  // Estado de carga
  if (isLoading) {
    return { loading: true };
  }

  // Estado de error
  if (error) {
    return { loading: true }; // Mostrar como loading en error
  }

  // Sin datos (no debería pasar)
  if (!data) {
    return { loading: true };
  }

  // Estado exitoso
  const donut: DonutDatum[] = (data.donutData ?? []).map((d) => ({
    label: d.label,
    value: d.value,
  }));

  return {
    loading: false,
    response: data,
    donut,
    deltaPct: data.deltaPct,
  };
}
