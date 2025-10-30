"use client";

import Header from "@/components/common/Header";
import { MapPinned } from "lucide-react";
import type { CustomersDemographicsSkeletonProps } from "./types";
import {
  DEFAULT_TITLE,
  DEFAULT_MAP_HEIGHT,
  DEFAULT_COUNTRY_ROWS,
  DEFAULT_CLASSNAME,
} from "./constants";
import { MapPlaceholder } from "./MapPlaceholder";
import { CountryRowSkeleton } from "./CountryRowSkeleton";

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
