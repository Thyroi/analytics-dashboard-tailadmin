"use client";

import StickyHeaderSection from "@/components/common/StickyHeaderSection";
import {
  TagTimeProvider,
  useTagTimeframe,
} from "@/features/analytics/context/TagTimeContext";
import { useChatbotCategoryTotals } from "@/features/chatbot/hooks/useChatbotCategoryTotals";
import { computeDeltaArtifact } from "@/lib/utils/delta";
import { toISO } from "@/lib/utils/time/datetime";
import { useState } from "react";
import DebugCategoryCard from "./DebugCategoryCard";
import DebugModal from "./DebugModal";

function DebugCategoriesSectionContent() {
  const {
    mode,
    granularity,
    startDate,
    endDate,
    setGranularity,
    setRange,
    clearRange,
    updatePickerDatesOnly,
    getCalculatedGranularity,
  } = useTagTimeframe();

  const [selectedCategory, setSelectedCategory] = useState<{
    id: string;
    label: string;
    rawData: unknown;
    processedData: {
      currentTotal: number;
      prevTotal: number;
      deltaAbs: number;
      deltaPct: number | null;
      artifactState: string;
    };
  } | null>(null);

  const startDateStr = startDate ? toISO(startDate) : null;
  const endDateStr = endDate ? toISO(endDate) : null;
  const effectiveGranularity = getCalculatedGranularity();

  const { categories, isLoading, meta, raw } = useChatbotCategoryTotals({
    granularity: effectiveGranularity,
    startDate: startDateStr,
    endDate: endDateStr,
  });

  const handleCardClick = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return;

    // Recalcular artifact para debug
    const artifact = computeDeltaArtifact(
      category.currentValue,
      category.previousValue
    );

    setSelectedCategory({
      id: category.id,
      label: category.label,
      rawData: {
        meta,
        raw,
        category: {
          id: category.id,
          currentTotal: category.currentValue,
          prevTotal: category.previousValue,
          deltaAbs: category.delta,
          deltaPercent: category.deltaPercent,
        },
      },
      processedData: {
        currentTotal: category.currentValue,
        prevTotal: category.previousValue,
        deltaAbs: artifact.deltaAbs ?? 0,
        deltaPct: artifact.deltaPct,
        artifactState: artifact.state,
      },
    });
  };

  return (
    <section className="max-w-[1560px] mx-auto w-full">
      <StickyHeaderSection
        title="Debug: Categorías Chatbot"
        subtitle="Inspecciona datos raw y deltas calculados"
        mode={mode}
        granularity={granularity}
        startDate={startDate}
        endDate={endDate}
        onGranularityChange={setGranularity}
        onRangeChange={setRange}
        onClearRange={clearRange}
        onPickerDatesUpdate={updatePickerDatesOnly}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4">
          {categories.map((category) => (
            <DebugCategoryCard
              key={category.id}
              id={category.id}
              label={category.label}
              iconSrc={category.iconSrc}
              currentValue={category.currentValue}
              previousValue={category.previousValue}
              deltaArtifact={category.deltaArtifact}
              onClick={() => handleCardClick(category.id)}
            />
          ))}
        </div>
      )}

      {/* Debug Modal */}
      {selectedCategory && (
        <DebugModal
          title={`Debug: ${selectedCategory.label}`}
          isOpen={!!selectedCategory}
          onClose={() => setSelectedCategory(null)}
          rawData={selectedCategory.rawData}
          processedData={selectedCategory.processedData}
        />
      )}
    </section>
  );
}

export default function DebugChatbotCategoriesSection() {
  return (
    <TagTimeProvider>
      <DebugCategoriesSectionContent />
    </TagTimeProvider>
  );
}
