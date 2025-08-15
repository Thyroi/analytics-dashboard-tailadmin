"use client";

import * as d3geo from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { useEffect, useMemo, useState } from "react";
import { feature as topojsonFeature } from "topojson-client";

type WorldTopoJSON = { type: "Topology"; objects: { countries: unknown } };

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  color?: string; // default #465FFF
  size?: number; // radio del punto interior; glow usa 2x
};

type Props = {
  markers: MapMarker[];
  height?: number; // default 260
  className?: string;
  topoUrl?: string; // default world-atlas 110m
  landFill?: string; // default rgba(148,163,184,0.25)
  landStroke?: string; // default rgba(148,163,184,0.35)
};

const DEFAULT_HEIGHT = 260;
const DEFAULT_TOPO =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function WorldBubbleMap({
  markers,
  height = DEFAULT_HEIGHT,
  className = "",
  topoUrl = DEFAULT_TOPO,
  landFill = "rgba(148,163,184,0.25)",
  landStroke = "rgba(148,163,184,0.35)",
}: Props) {
  const [geo, setGeo] = useState<FeatureCollection<Geometry> | null>(null);
  const [ready, setReady] = useState(false);

  // Carga Topo JSON una vez
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(topoUrl);
        const topo: WorldTopoJSON = await res.json();
        const fc = topojsonFeature(
          topo as unknown as Parameters<typeof topojsonFeature>[0],
          (topo.objects as { countries: unknown }).countries as Parameters<
            typeof topojsonFeature
          >[1]
        ) as FeatureCollection<Geometry>;
        if (!cancelled) {
          setGeo(fc);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setGeo(null);
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [topoUrl]);

  const viewBoxWidth = 1000;
  const viewBoxHeight = Math.max(200, height);

  const projection = useMemo(() => {
    const p = d3geo.geoMercator();
    p.scale((viewBoxWidth / (2 * Math.PI)) * 0.95).translate([
      viewBoxWidth / 2,
      viewBoxHeight / 1.6,
    ]);
    return p;
  }, [viewBoxHeight]);

  const path = useMemo(() => d3geo.geoPath(projection), [projection]);

  if (!ready) {
    return (
      <div
        className={`rounded-xl bg-white dark:bg-white/5 ${className}`}
        style={{ height }}
      />
    );
  }

  return (
    <div className={`rounded-xl bg-white p-2 dark:bg-white/5 ${className}`}>
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        role="img"
        aria-label="World map"
        className="w-full"
        style={{ height }}
      >
        {geo &&
          geo.features.map((f: Feature<Geometry>, idx: number) => {
            const d = path(f) ?? "";
            return (
              <path
                key={idx}
                d={d}
                fill={landFill}
                stroke={landStroke}
                strokeWidth={0.5}
              />
            );
          })}

        {markers.map((m) => {
          const point = projection([m.lng, m.lat]);
          if (!point) return null;
          const [x, y] = point;
          const color = m.color ?? "#465FFF";
          const r = m.size ?? 5;
          return (
            <g key={m.id} transform={`translate(${x}, ${y})`}>
              <circle r={r * 2} fill={color} opacity={0.15} />
              <circle r={r} fill={color} opacity={0.9} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
