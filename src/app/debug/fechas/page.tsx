"use client";

import StickyHeaderSection from "@/components/common/StickyHeaderSection";
import {
  TagTimeProvider,
  useTagTimeframe,
} from "@/features/analytics/context/TagTimeContext";
import { useCallback, useEffect, useState } from "react";

function DebugFechasInner() {
  const {
    mode,
    granularity,
    setGranularity,
    startDate,
    endDate,
    setRange,
    clearRange,
    getCurrentPeriod,
  } = useTagTimeframe();

  const [result, setResult] = useState<{
    url?: string;
    params?: Record<string, unknown>;
    response?: Record<string, unknown>;
    status?: number;
    error?: string;
  } | null>(null);
  const currentPeriod = getCurrentPeriod();

  const testFetch = useCallback(async () => {
    try {
      // NUEVO: Usar startDate y endDate como la API de totales
      const url = `/api/analytics/v1/dimensions/categorias/details/naturaleza?startDate=${currentPeriod.start}&endDate=${currentPeriod.end}&granularity=${granularity}`;

      console.log("URL:", url);

      const response = await fetch(url);
      const data = await response.json();

      setResult({
        url,
        params: {
          startDate: currentPeriod.start,
          endDate: currentPeriod.end,
          granularity: granularity,
        },
        response: data,
        status: response.status,
      });
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [currentPeriod.start, currentPeriod.end, granularity]); // Dependencies for useCallback

  // ✅ NUEVO: Auto-ejecutar query cuando cambien los parámetros del contexto
  useEffect(() => {
    testFetch();
  }, [granularity, currentPeriod.start, currentPeriod.end, mode, testFetch]);

  return (
    <div className="p-8">
      <StickyHeaderSection
        title="Debug Category Details - NIVEL 1"
        subtitle="Arreglar la query de category details"
        mode={mode}
        granularity={granularity}
        onGranularityChange={setGranularity}
        startDate={startDate}
        endDate={endDate}
        onRangeChange={setRange}
        onClearRange={clearRange}
      />

      <div className="mt-8">
        <div className="bg-blue-50 p-4 rounded mb-4">
          <h2 className="font-bold mb-2">Context Info</h2>
          <pre className="text-sm">
            {JSON.stringify(
              {
                granularity,
                currentPeriod,
                mode,
              },
              null,
              2
            )}
          </pre>
        </div>

        <button
          onClick={testFetch}
          className="bg-red-500 text-white px-4 py-2 rounded mb-4"
        >
          TEST FETCH DIRECTO
        </button>

        {result && (
          <div className="bg-gray-50 p-4 rounded">
            <h2 className="font-bold mb-2">Resultado</h2>
            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DebugFechasPage() {
  return (
    <TagTimeProvider>
      <DebugFechasInner />
    </TagTimeProvider>
  );
}
