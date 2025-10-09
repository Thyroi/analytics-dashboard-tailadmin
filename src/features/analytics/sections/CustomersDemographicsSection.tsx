"use client";

import type { MapMarker } from "@/components/charts/WorldBubbleMap";
import CustomersDemographics from "@/components/dashboard/CustomersDemographics";
import { useCountries } from "@/features/analytics/hooks/useCountries";
import { useCountryRegions } from "@/features/analytics/hooks/useCountryRegions";
import { useRegionCities } from "@/features/analytics/hooks/useRegionCities";
import {
  selectCountriesView,
  selectMapMarkers,
} from "@/features/analytics/selectors/demographics";
import { CustomersDemographicsSkeleton } from "@/features/analytics/skeletons";
import { useMemo, useState } from "react";
import { useHeaderAnalyticsTimeframe } from "../context/HeaderAnalyticsTimeContext";

// Centroides (o muévelo a un util compartido)
const centroids: Record<string, { lat: number; lng: number }> = {
  ES: { lat: 40.4637, lng: -3.7492 },
  US: { lat: 37.0902, lng: -95.7129 },
  // ...
};

const MAP_HEIGHT = 260;
const CARD_CLASS = "card bg-analytics-gradient overflow-hidden";

export default function CustomersDemographicsSection() {
  const { mode, startISO, endISO, granularity } = useHeaderAnalyticsTimeframe();
  const start = mode === "range" ? startISO : undefined;
  const end = mode === "range" ? endISO : undefined;

  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

  const {
    data: countriesData,
    isLoading,
    error,
  } = useCountries({ start, end, granularity, limit: 100 });

  const { data: regionsData } = useCountryRegions({
    country: expandedCountry ?? "",
    start,
    end,
    granularity,
    limit: 50,
    enabled: expandedCountry !== null,
  });

  const { data: citiesData } = useRegionCities({
    country: expandedCountry ?? "",
    region: expandedRegion ?? "",
    start,
    end,
    granularity,
    limit: 100,
    enabled: expandedCountry !== null && expandedRegion !== null,
  });

  const markers = useMemo<MapMarker[]>(
    () => selectMapMarkers(countriesData ?? null, centroids),
    [countriesData]
  );

  const countries = useMemo(
    () =>
      selectCountriesView({
        countriesData: countriesData ?? null,
        regionsData: regionsData ?? null,
        citiesData: citiesData ?? null,
        expandedCountry,
        expandedRegion,
      }),
    [countriesData, regionsData, citiesData, expandedCountry, expandedRegion]
  );

  if (isLoading) {
    return (
      <CustomersDemographicsSkeleton
        mapHeight={MAP_HEIGHT}
        className={CARD_CLASS}
      />
    );
  }

  if (error) {
    return (
      <div className={CARD_CLASS}>
        <div className="card-body text-red-500">{error.message}</div>
      </div>
    );
  }

  return (
    <CustomersDemographics
      markers={markers}
      countries={countries}
      mapHeight={MAP_HEIGHT}
      onToggleCountry={(code) => {
        setExpandedCountry((prev) => (prev === code ? null : code));
        setExpandedRegion(null);
      }}
      onToggleRegion={(_code, region) => {
        setExpandedRegion((prev) => (prev === region ? null : region));
      }}
      className={CARD_CLASS}
    />
  );
}
