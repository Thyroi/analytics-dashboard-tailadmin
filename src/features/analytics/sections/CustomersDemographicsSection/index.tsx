"use client";

import CustomersDemographics from "@/components/dashboard/CustomersDemographics";
import { useState } from "react";
import { useHeaderAnalyticsTimeframe } from "../../context/HeaderAnalyticsTimeContext";
import { CARD_CLASS, MAP_HEIGHT } from "./constants";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";
import { useDemographicsData } from "./useDemographicsData";

export default function CustomersDemographicsSection() {
  const { mode, startISO, endISO, granularity } = useHeaderAnalyticsTimeframe();
  const start = mode === "range" ? startISO : undefined;
  const end = mode === "range" ? endISO : undefined;

  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

  const { markers, countries, isLoading, error } = useDemographicsData({
    start,
    end,
    granularity,
    expandedCountry,
    expandedRegion,
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error.message} />;
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
