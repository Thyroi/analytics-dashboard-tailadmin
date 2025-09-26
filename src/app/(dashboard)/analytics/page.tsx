"use client";

import Header from "@/components/common/Header";
import AnalyticsProviders from "@/features/analytics/providers/AnalyticsProviders";
import AnalyticsByTagSection from "@/features/analytics/sections/AnalyticsByTagSection";
import AnalyticsByTownSection from "@/features/analytics/sections/AnalyticsByTownSection";
import AnalyticsKPISection from "@/features/analytics/sections/AnalyticsKPISection";
import CustomersDemographicsSection from "@/features/analytics/sections/CustomersDemographicsSection";
import DevicesOsSection from "@/features/analytics/sections/DevicesOsDonutSection";
import GenderDonutSection from "@/features/analytics/sections/GenderDonutSection";
import TopPagesRangeSection from "@/features/analytics/sections/TopPagesRangeSection";
import UserAcquisitionSection from "@/features/analytics/sections/UserAcquisitionSection";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Wrapper que solo agrega el Suspense boundary
export default function AnalyticsPage() {
  return (
    <Suspense fallback={null /* o un skeleton */}>
      <AnalyticsPageInner />
    </Suspense>
  );
}

function AnalyticsPageInner() {
  const searchParams = useSearchParams();

  const pueblo = searchParams.get("pueblo") || undefined;
  const dateFrom = searchParams.get("from") || undefined; // ej: 2025-05-01
  const dateTo = searchParams.get("to") || undefined; // ej: 2025-08-31

  return (
    <AnalyticsProviders>
      <div className="flex flex-col gap-6">
        <Header
          title="Condado de Huelva"
          subtitle="Información y estadísticas del tráfico de la web del Condado de Huelva"
        />

        {/* Fila 1: KPIs 30% + Top Pages 70% */}
        <section className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-stretch">
          <div className="lg:col-span-3 h-full">
            <AnalyticsKPISection className="h-full" stretch />
          </div>
          <div className="lg:col-span-7">
            <TopPagesRangeSection />
          </div>
        </section>

        {/* Fila 2: Acquisition 70% + Devices 30% */}
        <section className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-stretch">
          <div className="lg:col-span-7">
            <UserAcquisitionSection />
          </div>
          <div className="lg:col-span-3">
            <DevicesOsSection granularity="d" />
            <GenderDonutSection granularity="d" />
          </div>
        </section>

        {/* Fila 3: Customers Demographics 100% */}
        <section>
          <CustomersDemographicsSection />
        </section>

        {/* Top Tags - Slider infinito */}
        <section aria-labelledby="top-tags-title" className="space-y-3">
          <AnalyticsByTagSection />
          <AnalyticsByTownSection />
        </section>
      </div>
    </AnalyticsProviders>
  );
}
