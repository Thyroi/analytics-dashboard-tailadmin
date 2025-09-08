"use client";

import { useKPIOverview } from "@/hooks/useTags"; // ajusta la ruta
import type { Granularity } from "@/lib/chatbot/tags";
import { Users } from "lucide-react";
import { useMemo, useState } from "react";
import GeneralDataBody from "./GeneralDataBody";
import GeneralDataHeader from "./GeneralDataHeader";

/* Helpers fecha */
function dateToISO(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function addDays(d: Date, delta: number): Date {
  const x = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
  x.setUTCDate(x.getUTCDate() + delta);
  return x;
}

/* Tipos internos */
type Mode = "granularity" | "range";
type DateRange = { startTime: string; endTime: string } | null;

type Props = {
  title?: string;
  metric?: "visits" | "interactions";
  defaultGranularity?: Granularity;
  className?: string;
};

export default function GeneralDataCard({
  title = "Usuarios totales",
  metric = "visits",
  defaultGranularity = "m",
  className = "",
}: Props) {
  // ====== Estado principal ======
  const [mode, setMode] = useState<Mode>("granularity");
  const [granularity, setGranularity] =
    useState<Granularity>(defaultGranularity);

  // Rango inicial: últimos 30 días
  const today = useMemo(() => {
    const now = new Date();
    return new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
  }, []);
  const defaultStart = useMemo(() => addDays(today, -29), [today]);

  const [from, setFrom] = useState<Date>(defaultStart);
  const [to, setTo] = useState<Date>(today);

  const effectiveRange: DateRange =
    mode === "range"
      ? { startTime: dateToISO(from), endTime: dateToISO(to) }
      : null;

  // Hook de datos
  const { totals, series } = useKPIOverview(
    mode === "range" ? null : granularity,
    effectiveRange ?? undefined
  );

  // Selección de métrica para el header
  const currentValue =
    metric === "visits" ? totals.current.visits : totals.current.interactions;
  const deltaPct =
    metric === "visits" ? totals.pct.visits : totals.pct.interactions;

  // Handlers
  const handleGranularityChange = (g: Granularity) => {
    setGranularity(g);
    setMode("granularity");
  };
  const handleRangeChange = (start: Date, end: Date) => {
    setFrom(start);
    setTo(end);
    setMode("range");
  };
  const clearRange = () => {
    setFrom(defaultStart);
    setTo(today);
    setMode("granularity");
  };

  return (
    <div
      className={`w-full rounded-xl bg-white dark:bg-gray-900 shadow-sm ring-1 ring-black/5 overflow-hidden ${className}`}
    >
      <GeneralDataHeader
        title={title}
        value={currentValue}
        deltaPct={deltaPct}
        icon={<Users className="h-5 w-5" />}
      />

      <GeneralDataBody
        mode={mode}
        granularity={granularity}
        onGranularityChange={handleGranularityChange}
        startDate={from}
        endDate={to}
        onRangeChange={handleRangeChange}
        onClearRange={clearRange}
        kpiSeries={series}
      />
    </div>
  );
}
