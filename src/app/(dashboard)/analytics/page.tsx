"use client";

import {
  HeaderAnalyticsTimeProvider,
  useHeaderAnalyticsTimeframe,
} from "@/features/analytics/context/HeaderAnalyticsTimeContext";
import AnalyticsProviders from "@/features/analytics/providers/AnalyticsProviders";
import StickyHeaderSection from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/StickyHeaderSection";

import AnalyticsByTagSection from "@/features/analytics/sections/AnalyticsByTagSection";
import AnalyticsByTownSection from "@/features/analytics/sections/AnalyticsByTownSection";
import AnalyticsKPISection from "@/features/analytics/sections/AnalyticsKPISection";
import CustomersDemographicsSection from "@/features/analytics/sections/CustomersDemographicsSection";
import DevicesOsSection from "@/features/analytics/sections/DevicesOsDonutSection";
import GenderDonutSection from "@/features/analytics/sections/GenderDonutSection";
import UserAcquisitionSection from "@/features/analytics/sections/UserAcquisitionSection";
import { Suspense } from "react";

export default function AnalyticsPage() {
  return (
    <Suspense fallback={null}>
      <AnalyticsProviders>
        <HeaderAnalyticsTimeProvider>
          <PageBody />
        </HeaderAnalyticsTimeProvider>
      </AnalyticsProviders>
    </Suspense>
  );
}

function PageBody() {
  const {
    mode,
    granularity,
    setGranularity,
    startDate,
    endDate,
    setRange,
    clearRange,
  } = useHeaderAnalyticsTimeframe();

  return (
    <div className="flex flex-col gap-6">
      <StickyHeaderSection
        title="Analíticas (Header KPIs)"
        subtitle="Control de rango y granularidad de la cabecera"
        mode={mode}
        granularity={granularity}
        onGranularityChange={setGranularity}
        startDate={startDate}
        endDate={endDate}
        onRangeChange={setRange}
        onClearRange={clearRange}
      />
      {/* KPIs con wrap min 221px */}
      <section>
        <AnalyticsKPISection className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(221px,1fr))]" />
      </section>
      {/* Resto del dashboard
      <section>
        <TopPagesRangeSection />
      </section> */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <UserAcquisitionSection />
        <DevicesOsSection />
        <GenderDonutSection />
      </section>
      <section>
        <CustomersDemographicsSection />
      </section>
      <section className="space-y-3">
        <AnalyticsByTagSection />
        <AnalyticsByTownSection />
      </section>
    </div>
  );
}
