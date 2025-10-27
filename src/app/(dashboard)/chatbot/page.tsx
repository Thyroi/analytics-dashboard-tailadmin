"use client";

import CategoryDrilldownView from "@/features/chatbot/components/CategoryDrilldownView";
import ChatbotCategoriesSection from "@/features/chatbot/components/ChatbotCategoriesSection";
import ChatbotTownsSection from "@/features/chatbot/components/ChatbotTownsSection";
import {
  TagTimeProvider,
  useTagTimeframe,
} from "@/features/analytics/context/TagTimeContext";
import type { CategoryId } from "@/lib/taxonomy/categories";
import { useState } from "react";

function TagsDashboardContent() {
  const { getCalculatedGranularity, startDate, endDate } = useTagTimeframe();
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(
    null
  );

  // Convertir fechas del contexto a formato ISO string (YYYY-MM-DD)
  const startDateStr = startDate?.toISOString().split("T")[0] || null;
  const endDateStr = endDate?.toISOString().split("T")[0] || null;

  if (selectedCategory) {
    return (
      <CategoryDrilldownView
        categoryId={selectedCategory}
        granularity={getCalculatedGranularity()}
        startDate={startDateStr}
        endDate={endDateStr}
        onBack={() => setSelectedCategory(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Categories section with sticky header */}
      <ChatbotCategoriesSection />

      {/* Towns section with sticky header */}
      <ChatbotTownsSection />
    </div>
  );
}

export default function TagsDashboard() {
  return (
    <TagTimeProvider>
      <TagsDashboardContent />
    </TagTimeProvider>
  );
}
