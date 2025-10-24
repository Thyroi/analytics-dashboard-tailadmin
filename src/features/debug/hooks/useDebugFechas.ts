/**
 * Hook para usar el servicio de debug de fechas
 */

import { useQuery } from "@tanstack/react-query";
import { useDateRange } from "../context/DateRangeContext";
import {
  DebugFechasService,
  type DebugFechasParams,
} from "../services/debugFechasService";

const debugService = new DebugFechasService();

export function useDebugFechas(overrideParams?: Partial<DebugFechasParams>) {
  const { getCurrentPeriod, getCalculatedGranularity, mode } = useDateRange();

  const currentPeriod = getCurrentPeriod();
  const calculatedGranularity = getCalculatedGranularity();

  // Parámetros finales (contexto + override)
  const finalParams: DebugFechasParams = {
    start: overrideParams?.start || currentPeriod.start,
    end: overrideParams?.end || currentPeriod.end,
    granularity:
      overrideParams?.granularity ||
      (mode === "granularity" ? calculatedGranularity : undefined),
  };

  const query = useQuery({
    queryKey: ["debug-fechas", finalParams],
    queryFn: () => debugService.fetchDebugData(finalParams),
    enabled: !!(finalParams.start && finalParams.end),
    staleTime: 30000, // 30 segundos
    refetchOnWindowFocus: false,
  });

  return {
    ...query,
    params: finalParams,
    refetch: query.refetch,
  };
}

export function useDebugFechasManual() {
  const testRangeCalculation = async (
    start: string,
    end: string,
    granularityOverride?: DebugFechasParams["granularity"]
  ) => {
    return debugService.testRangeCalculation(start, end, granularityOverride);
  };

  return {
    testRangeCalculation,
  };
}
