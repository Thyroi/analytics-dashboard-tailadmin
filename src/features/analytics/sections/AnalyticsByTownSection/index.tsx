"use client";

import { TownTimeProvider } from "@/features/analytics/context/TownTimeContext";
import { SectionContent } from "./SectionContent";

export default function AnalyticsByTownSection() {
  return (
    <TownTimeProvider>
      <SectionContent />
    </TownTimeProvider>
  );
}

// Export types for external use
export type { Drill, Level2Data } from "./types";
