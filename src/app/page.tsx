"use client";

import DateRangePicker from "@/components/common/DateRangePicker";
import GranularityTabs from "@/components/dashboard/GranularityTabs";
import TotalsStats from "@/features/home/TotalsStats";
import TownTotalsList from "@/features/home/TownTotalsList";
import type { Granularity } from "@/lib/chatbot/tags";
import { useMemo, useState } from "react";

function dateToISO(d: Date): string {
  // YYYY-MM-DD (UTC) para alinear con SERIES
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Home() {
  const [granularity, setGranularity] = useState<Granularity>("m");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const startISO = useMemo(
    () => (startDate ? dateToISO(startDate) : undefined),
    [startDate]
  );
  const endISO = useMemo(
    () => (endDate ? dateToISO(endDate) : undefined),
    [endDate]
  );

  return (
    <main className="p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-3">
          <GranularityTabs value={granularity} onChange={setGranularity} />
          <DateRangePicker
            startDate={startDate ?? new Date()}
            endDate={endDate ?? new Date()}
            placeholder="Selecciona rango (opcional)"
            onRangeChange={(start: Date, end: Date) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />
        </div>
      </div>
      <TotalsStats
        className="mb-6"
        startTime={startISO}
        endTime={endISO}
        granularity={granularity}
        
      />
      <TownTotalsList
        title="Totales por municipio"
        className="mt-2"
        maxHeight={420}
        granularity={granularity}
        startTime={startISO}
        endTime={endISO}
        showVisitsInstead={false}
      />
    </main>
  );
}
