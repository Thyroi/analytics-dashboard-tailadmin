"use client";

import StickyHeaderSection from "@/components/common/StickyHeaderSection";
import {
  TagTimeProvider,
  useTagTimeframe,
} from "@/features/analytics/context/TagTimeContext";
import { useResumenCategory } from "@/features/home/hooks/useResumenCategory";
import SectorsByTagSectionContent from "@/features/home/sectors/SectorsByTagSection";

function InnerSectorsByTagSection() {
  const {
    mode,
    granularity,
    startDate,
    endDate,
    setGranularity,
    setRange,
    clearRange,
  } = useTagTimeframe();

  // USAR CÁLCULO AUTOMÁTICO CORRECTO - SIN FECHAS HARDCODEADAS
  const hookParams = { granularity };

  // Importar useResumenCategory para obtener totales globales
  // USANDO LOS MISMOS PARÁMETROS QUE EL DEBUG
  const { categoriesData } = useResumenCategory(hookParams);

  // Calcular totales globales de GA4 y Chatbot
  const totals = categoriesData.reduce(
    (
      acc: { ga4: number; chatbot: number },
      item: { ga4Value: number; chatbotValue: number }
    ) => ({
      ga4: acc.ga4 + item.ga4Value,
      chatbot: acc.chatbot + item.chatbotValue,
    }),
    { ga4: 0, chatbot: 0 }
  );

  const subtitle = `GA4: ${totals.ga4.toLocaleString()} • Chatbot: ${totals.chatbot.toLocaleString()} • Total: ${(
    totals.ga4 + totals.chatbot
  ).toLocaleString()}`;

  return (
    <section className="max-w-[1560px] mx-auto w-full">
      <StickyHeaderSection
        title="Sectores por categoría"
        subtitle={subtitle}
        mode={mode}
        granularity={granularity}
        startDate={startDate}
        endDate={endDate}
        onGranularityChange={setGranularity}
        onRangeChange={setRange}
        onClearRange={clearRange}
      />
      <SectorsByTagSectionContent granularity={granularity} />
    </section>
  );
}

export default function SectorsByTagSection() {
  return (
    <TagTimeProvider>
      <InnerSectorsByTagSection />
    </TagTimeProvider>
  );
}
