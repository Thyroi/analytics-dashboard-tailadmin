// src/components/charts/CustomersDemographicCard.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3geo from "d3-geo";
import { feature as topojsonFeature } from "topojson-client";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import ReactCountryFlag from "react-country-flag";
import DateRangePicker from "@/components/ui/DateRangePicker";
import CustomersDemographicSkeleton from "@/components/skeletons/CustomersDemographicSkeleton";

const WORLD_TOPO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type ApiRow = { country: string; code: string; customers: number; pct: number };
type CountriesResponse = { total: number; rows: ApiRow[] };
type CardRow = ApiRow & { lat?: number; lng?: number };
type WorldTopoJSON = { type: "Topology"; objects: { countries: unknown } };

const countryCentroids: Record<string, { lat: number; lng: number }> = {
  US: { lat: 37.0902, lng: -95.7129 },
  FR: { lat: 46.2276, lng: 2.2137 },
  BR: { lat: -14.235, lng: -51.9253 },
  IN: { lat: 20.5937, lng: 78.9629 },
  ES: { lat: 40.4637, lng: -3.7492 },
  MX: { lat: 23.6345, lng: -102.5528 },
  AR: { lat: -38.4161, lng: -63.6167 },
  CO: { lat: 4.5709, lng: -74.2973 },
  GB: { lat: 55.3781, lng: -3.436 },
  DE: { lat: 51.1657, lng: 10.4515 },
  IT: { lat: 41.8719, lng: 12.5674 },
  CA: { lat: 56.1304, lng: -106.3468 },
  AU: { lat: -25.2744, lng: 133.7751 },
  NL: { lat: 52.1326, lng: 5.2913 },
  SE: { lat: 60.1282, lng: 18.6435 },
  NO: { lat: 60.472, lng: 8.4689 },
  CL: { lat: -35.6751, lng: -71.543 },
  PE: { lat: -9.19, lng: -75.0152 },
  PT: { lat: 39.3999, lng: -8.2245 },
  JP: { lat: 36.2048, lng: 138.2529 },
};

const MAP_HEIGHT = 260;

export default function CustomersDemographicCard() {
  // Rango por defecto
  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setMonth(today.getMonth() - 1);

  const [startDate, setStartDate] = useState<Date>(monthAgo);
  const [endDate, setEndDate] = useState<Date>(today);

  // Datos GA
  const [rows, setRows] = useState<CardRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [dataLoading, setDataLoading] = useState<boolean>(true);

  // Mapa
  const [geo, setGeo] = useState<FeatureCollection<Geometry> | null>(null);
  const [mapReady, setMapReady] = useState<boolean>(false);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  // Fetch GA4 (países)
  const lastRange = useRef<string>("");
  useEffect(() => {
    const key = `${formatDate(startDate)}_${formatDate(endDate)}`;
    if (lastRange.current === key) return;
    lastRange.current = key;

    (async () => {
      setDataLoading(true);
      try {
        const res = await fetch(
          `/api/analytics/countries?start=${formatDate(startDate)}&end=${formatDate(endDate)}`
        );
        const data: CountriesResponse = await res.json();
        const list: CardRow[] = (data.rows ?? []).map((r) => ({
          ...r,
          ...(countryCentroids[r.code] ?? {}),
        }));
        setRows(list);
        setTotal(data.total ?? 0);
      } catch {
        setRows([]);
        setTotal(0);
      } finally {
        setTimeout(() => setDataLoading(false), 120);
      }
    })();
  }, [startDate, endDate]);

  // Fetch TopoJSON una vez
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(WORLD_TOPO_URL);
        const topo: WorldTopoJSON = await res.json();
        const fc = topojsonFeature(
          topo as unknown as Parameters<typeof topojsonFeature>[0],
          (topo.objects as { countries: unknown }).countries as Parameters<
            typeof topojsonFeature
          >[1]
        ) as FeatureCollection<Geometry>;
        setGeo(fc);
        setTimeout(() => setMapReady(true), 120);
      } catch {
        setGeo(null);
        setMapReady(true);
      }
    })();
  }, []);

  // Proyección
  const viewBoxWidth = 1000;
  const viewBoxHeight = Math.max(200, MAP_HEIGHT);
  const projection = useMemo(() => {
    const p = d3geo.geoMercator();
    p.scale((viewBoxWidth / (2 * Math.PI)) * 0.95).translate([
      viewBoxWidth / 2,
      viewBoxHeight / 1.6,
    ]);
    return p;
  }, [viewBoxWidth, viewBoxHeight]);
  const path = useMemo(() => d3geo.geoPath(projection), [projection]);

  const top = useMemo(
    () => [...rows].sort((a, b) => b.customers - a.customers).slice(0, 6),
    [rows]
  );

  // Skeleton gate
  const isLoading = !mapReady || dataLoading;
  if (isLoading) {
    // Ajusta el skeleton para aceptar solo { height?: number; rows?: number }
    return <CustomersDemographicSkeleton height={MAP_HEIGHT} rows={6} />;
  }

  return (
    <div className="card">
      {/* Header interno */}
      <div className="card-header">
        <div>
          <h3 className="card-title">Demografía de clientes</h3>
          <p className="card-subtitle">Número de clientes según el país</p>
        </div>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onRangeChange={(s, e) => {
            setStartDate(s);
            setEndDate(e);
          }}
        />
      </div>

      {/* Body */}
      <div className="card-body">
        {/* Mapa */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50/60 p-2 dark:border-gray-800 dark:bg-white/[0.05]">
          <div className="rounded-xl bg-white p-2 dark:bg-white/5">
            <svg
              viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
              role="img"
              aria-label="World map"
              className="w-full"
              style={{ height: MAP_HEIGHT }}
            >
              {geo &&
                geo.features.map((f: Feature<Geometry>, idx: number) => {
                  const d = path(f) ?? "";
                  return (
                    <path
                      key={idx}
                      d={d}
                      fill="rgba(148,163,184,0.25)"
                      stroke="rgba(148,163,184,0.35)"
                      strokeWidth={0.5}
                    />
                  );
                })}

              {rows.map((r) => {
                if (r.lat === undefined || r.lng === undefined) return null;
                const point = projection([r.lng, r.lat]);
                if (!point) return null;
                const [x, y] = point;
                return (
                  <g key={r.code} transform={`translate(${x}, ${y})`}>
                    <circle r={10} fill="#465FFF" opacity={0.15} />
                    <circle r={5} fill="#465FFF" opacity={0.9} />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Lista */}
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
                  <div className="truncate font-medium text-gray-800 dark:text-white/90">
                    {d.country}
                  </div>
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
                      background:
                        "linear-gradient(90deg, rgba(70,95,255,1) 0%, rgba(70,95,255,0.6) 100%)",
                    }}
                  />
                </div>
                <div className="w-10 text-right text-sm font-semibold text-gray-700 dark:text:white/80">
                  {d.pct}%
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-4 text-right text-xs text-gray-500 dark:text-gray-400">
          Total: {total.toLocaleString()} users
        </div>
      </div>
    </div>
  );
}
