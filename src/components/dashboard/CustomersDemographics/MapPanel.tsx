"use client";

import WorldBubbleMap, { type MapMarker } from "@/components/charts/WorldBubbleMap";

type Props = { markers: MapMarker[]; height: number };

export default function MapPanel({ markers, height }: Props) {
  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50/60 p-2 dark:border-gray-800 dark:bg-white/[0.05]">
      <WorldBubbleMap markers={markers} height={height} />
    </div>
  );
}
