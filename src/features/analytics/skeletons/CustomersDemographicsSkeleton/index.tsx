"use client";

import Header from "@/components/common/Header";
import { MapPinned } from "lucide-react";
import {
  DEFAULT_CLASSNAME,
  DEFAULT_COUNTRY_ROWS,
  DEFAULT_MAP_HEIGHT,
  DEFAULT_TITLE,
} from "./constants";
import { CountryRowSkeleton } from "./CountryRowSkeleton";
import { MapPlaceholder } from "./MapPlaceholder";
import type { CustomersDemographicsSkeletonProps } from "./types";

export default function CustomersDemographicsSkeleton({
  title = DEFAULT_TITLE,
  mapHeight = DEFAULT_MAP_HEIGHT,
  countryRows = DEFAULT_COUNTRY_ROWS,
  className = DEFAULT_CLASSNAME,
}: CustomersDemographicsSkeletonProps) {
  return (
    <div className={className} aria-busy="true">
      <div className="card-header">
        <Header title={title} Icon={MapPinned} titleSize="xs" />
      </div>

      <div className="card-body">
        <MapPlaceholder height={mapHeight} />

        {/* Lista de países skeleton */}
        <div className="space-y-4">
          {Array.from({ length: countryRows }).map((_, i) => (
            <CountryRowSkeleton key={i} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
