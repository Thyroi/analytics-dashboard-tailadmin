"use client";

import { useMemo, useState } from "react";
import WorldBubbleMap, { MapMarker } from "@/components/charts/WorldBubbleMap";
import DateRangePicker from "@/components/common/DateRangePicker";
import CustomersDemographicSkeleton from "@/components/skeletons/CustomersDemographicSkeleton";
import ReactCountryFlag from "react-country-flag";
import { useCountries } from "@/features/analytics/hooks/useCountries";

const countryCentroids: Record<string, { lat: number; lng: number }> = {
  US: { lat: 37.0902, lng: -95.7129 }, FR: { lat: 46.2276, lng: 2.2137 },
  BR: { lat: -14.235, lng: -51.9253 }, IN: { lat: 20.5937, lng: 78.9629 },
  ES: { lat: 40.4637, lng: -3.7492 }, MX: { lat: 23.6345, lng: -102.5528 },
  AR: { lat: -38.4161, lng: -63.6167 }, CO: { lat: 4.5709, lng: -74.2973 },
  GB: { lat: 55.3781, lng: -3.436 },   DE: { lat: 51.1657, lng: 10.4515 },
  IT: { lat: 41.8719, lng: 12.5674 },  CA: { lat: 56.1304, lng: -106.3468 },
  AU: { lat: -25.2744, lng: 133.7751 }, NL: { lat: 52.1326, lng: 5.2913 },
  SE: { lat: 60.1282, lng: 18.6435 },  NO: { lat: 60.472, lng: 8.4689 },
  CL: { lat: -35.6751, lng: -71.543 }, PE: { lat: -9.19, lng: -75.0152 },
  PT: { lat: 39.3999, lng: -8.2245 },  JP: { lat: 36.2048, lng: 138.2529 },
};

const MAP_HEIGHT = 260;
const toISO = (d: Date) => d.toISOString().split("T")[0];

export default function CustomersDemographicsSection() {
  // Rango por defecto (último mes)
  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setMonth(today.getMonth() - 1);

  const [startDate, setStartDate] = useState<Date>(monthAgo);
  const [endDate, setEndDate] = useState<Date>(today);

  const { data, isLoading, error } = useCountries({
    start: toISO(startDate),
    end: toISO(endDate),
    granularity: "d",
    limit: 100,
  });

  const markers: MapMarker[] = useMemo(() => {
    if (!data) return [];
    return data.rows
      .map((r) => {
        const c = countryCentroids[r.code];
        if (!c) return null;
        return {
          id: r.code,
          lat: c.lat,
          lng: c.lng,
          color: "#465FFF",
          size: Math.max(4, Math.min(10, Math.sqrt(r.customers))),
        } as MapMarker;
      })
      .filter(Boolean) as MapMarker[];
  }, [data]);

  const top = useMemo(
    () => (data ? [...data.rows].sort((a, b) => b.customers - a.customers).slice(0, 6) : []),
    [data]
  );

  if (isLoading) return <CustomersDemographicSkeleton height={MAP_HEIGHT} rows={6} />;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">Demografía de clientes</h3>
          <p className="card-subtitle">Número de clientes según el país</p>
        </div>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onRangeChange={(s, e) => { setStartDate(s); setEndDate(e); }}
        />
      </div>

      <div className="card-body">
        {error ? (
          <div className="text-sm text-red-500 flex items-center justify-center" style={{ height: MAP_HEIGHT }}>
            {error.message}
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50/60 p-2 dark:border-gray-800 dark:bg-white/[0.05]">
              <WorldBubbleMap markers={markers} height={MAP_HEIGHT} />
            </div>

            <div className="space-y-4">
              {top.map((d) => (
                <div key={d.code} className="flex items-center gap-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <ReactCountryFlag
                      svg
                      countryCode={d.code}
                      style={{ width: "28px", height: "20px", borderRadius: 4 }}
                      title={d.country}
                    />
                    <div className="min-w-0">
                      <div className="truncate font-medium text-gray-800 dark:text-white/90">{d.country}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {d.customers.toLocaleString()} Customers
                      </div>
                    </div>
                  </div>

                  <div className="flex w-1/2 min-w-[180px] items-center gap-3">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${d.pct}%`,
                          background: "linear-gradient(90deg, rgba(70,95,255,1) 0%, rgba(70,95,255,0.6) 100%)",
                        }}
                      />
                    </div>
                    <div className="w-10 text-right text-sm font-semibold text-gray-700 dark:text-white/80">
                      {d.pct}%
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-right text-xs text-gray-500 dark:text-gray-400">
              Total: {data?.total.toLocaleString() ?? 0} users
            </div>
          </>
        )}
      </div>
    </div>
  );
}
