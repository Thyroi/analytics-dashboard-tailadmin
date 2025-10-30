import type { MapMarker } from "@/components/charts/WorldBubbleMap";
import { useCountries } from "@/features/analytics/hooks/useCountries";
import { useCountryRegions } from "@/features/analytics/hooks/useCountryRegions";
import { useRegionCities } from "@/features/analytics/hooks/useRegionCities";
import {
  selectCountriesView,
  selectMapMarkers,
} from "@/features/analytics/selectors/demographics";
import type { Granularity } from "@/lib/types";
import { useMemo } from "react";
import { CENTROIDS } from "./constants";

interface UseDemographicsDataParams {
  start?: string;
  end?: string;
  granularity: Granularity;
  expandedCountry: string | null;
  expandedRegion: string | null;
}

export function useDemographicsData({
  start,
  end,
  granularity,
  expandedCountry,
  expandedRegion,
}: UseDemographicsDataParams) {
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
    () => selectMapMarkers(countriesData ?? null, CENTROIDS),
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

  return { markers, countries, isLoading, error };
}
