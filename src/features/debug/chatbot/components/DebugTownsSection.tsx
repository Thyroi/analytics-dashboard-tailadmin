"use client";

import StickyHeaderSection from "@/components/common/StickyHeaderSection";
import {
  TownTimeProvider,
  useTownTimeframe,
} from "@/features/analytics/context/TownTimeContext";
import { useChatbotTownTotals } from "@/features/chatbot/hooks/useChatbotTownTotals";
import { computeDeltaArtifact } from "@/lib/utils/delta";
import { toISO } from "@/lib/utils/time/datetime";
import { useState } from "react";
import DebugModal from "./DebugModal";
import DebugTownCard from "./DebugTownCard";

function DebugTownsSectionContent() {
  const {
    mode,
    granularity,
    startDate,
    endDate,
    setGranularity,
    setRange,
    clearRange,
    getCalculatedGranularity,
  } = useTownTimeframe();

  const [selectedTown, setSelectedTown] = useState<{
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

  const { towns, isLoading, meta, raw } = useChatbotTownTotals({
    granularity: effectiveGranularity,
    startDate: startDateStr,
    endDate: endDateStr,
  });

  const handleCardClick = (townId: string) => {
    const town = towns.find((t) => t.id === townId);
    if (!town) return;

    // Recalcular artifact para debug
    const artifact = computeDeltaArtifact(
      town.currentValue,
      town.previousValue
    );

    setSelectedTown({
      id: town.id,
      label: town.label,
      rawData: {
        meta,
        raw,
        town: {
          id: town.id,
          currentTotal: town.currentValue,
          prevTotal: town.previousValue,
          deltaAbs: town.delta,
          deltaPercent: town.deltaPercent,
        },
      },
      processedData: {
        currentTotal: town.currentValue,
        prevTotal: town.previousValue,
        deltaAbs: artifact.deltaAbs ?? 0,
        deltaPct: artifact.deltaPct,
        artifactState: artifact.state,
      },
    });
  };

  return (
    <section className="max-w-[1560px] mx-auto w-full">
      <StickyHeaderSection
        title="Debug: Pueblos Chatbot"
        subtitle="Inspecciona datos raw y deltas calculados"
        mode={mode}
        granularity={granularity}
        startDate={startDate}
        endDate={endDate}
        onGranularityChange={setGranularity}
        onRangeChange={setRange}
        onClearRange={clearRange}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4">
          {towns.map((town) => (
            <DebugTownCard
              key={town.id}
              id={town.id}
              label={town.label}
              iconSrc={town.iconSrc}
              currentValue={town.currentValue}
              previousValue={town.previousValue}
              deltaArtifact={town.deltaArtifact}
              onClick={() => handleCardClick(town.id)}
            />
          ))}
        </div>
      )}

      {/* Debug Modal */}
      {selectedTown && (
        <DebugModal
          title={`Debug: ${selectedTown.label}`}
          isOpen={!!selectedTown}
          onClose={() => setSelectedTown(null)}
          rawData={selectedTown.rawData}
          processedData={selectedTown.processedData}
        />
      )}
    </section>
  );
}

export default function DebugChatbotTownsSection() {
  return (
    <TownTimeProvider>
      <DebugTownsSectionContent />
    </TownTimeProvider>
  );
}
