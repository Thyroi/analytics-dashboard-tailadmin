"use client";

import GroupedBarChartExample from "@/components/charts/GroupedBarChartExample";
import CategoryDrilldownExample from "@/components/examples/CategoryDrilldownExample";
import CategoryDrilldownView from "@/features/chatbot/components/CategoryDrilldownView";
import ChatbotCategoriesSection from "@/features/chatbot/components/ChatbotCategoriesSection";
import RealCategoryDrilldownDemo from "@/features/chatbot/components/RealCategoryDrilldownDemo";
import type { CategoryId } from "@/lib/taxonomy/categories";
import { useState } from "react";
import TestQuery from "./test-query";

export default function TagsDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(
    null
  );

  if (selectedCategory) {
    return (
      <CategoryDrilldownView
        categoryId={selectedCategory}
        granularity="d" // Usar granularidad por defecto, se puede sincronizar con el contexto
        onBack={() => setSelectedCategory(null)}
        onSubcategoryClick={(_subcategory) => {
          // TODO: Implementar siguiente nivel de drilldown
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Categories section with sticky header */}
      <ChatbotCategoriesSection />

      {/* Real Category Drilldown Demo */}
      <RealCategoryDrilldownDemo />

      {/* Category Drilldown Examples with ChartPair */}
      <div className="max-w-[1560px] mx-auto w-full px-4">
        <CategoryDrilldownExample />
      </div>

      {/* Grouped Bar Chart Examples */}
      <div className="max-w-[1560px] mx-auto w-full px-4">
        <GroupedBarChartExample />
      </div>

      {/* Test Query section */}
      <div className="space-y-4 max-w-[1560px] mx-auto w-full px-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Test Query
        </h2>
        <TestQuery />
      </div>
    </div>
  );
}
