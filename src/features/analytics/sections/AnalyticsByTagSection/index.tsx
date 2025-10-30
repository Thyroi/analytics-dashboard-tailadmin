"use client";

import { TagTimeProvider } from "@/features/analytics/context/TagTimeContext";
import { SectionContent } from "./SectionContent";

export default function AnalyticsByTagSection() {
  return (
    <TagTimeProvider>
      <SectionContent />
    </TagTimeProvider>
  );
}

// Export types for external use
export type { Drill, Level2Data } from "./types";
