"use client";

import CategoryDrilldownView from "@/features/chatbot/components/CategoryDrilldownView";
import ChatbotCategoriesSection from "@/features/chatbot/components/ChatbotCategoriesSection";
import type { CategoryId } from "@/lib/taxonomy/categories";
import { useState } from "react";

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
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Categories section with sticky header */}
      <ChatbotCategoriesSection />

    </div>
  );
}
