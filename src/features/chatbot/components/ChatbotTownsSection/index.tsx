"use client";

import { TagTimeProvider } from "@/features/analytics/context/TagTimeContext";
import { SectionContent } from "./SectionContent";

export default function ChatbotTownsSection() {
  return (
    <TagTimeProvider>
      <SectionContent />
    </TagTimeProvider>
  );
}

// Export types for external use
export type { DrilldownCallbacks, TownCardData, TownGridProps } from "./types";
