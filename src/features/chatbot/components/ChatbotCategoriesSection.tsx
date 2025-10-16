/**
 * Componente para mostrar categorías de chatbot usando delta cards
 * Similar a SectorsByTagSection pero para datos de chatbot
 * Incluye sistema de drilldown basado en fechas reales del API
 */

"use client";

import DeltaCard from "@/components/common/DeltaCard";
import StickyHeaderSection from "@/components/common/StickyHeaderSection";
import {
  TagTimeProvider,
  useTagTimeframe,
} from "@/features/analytics/context/TagTimeContext";
import type { CategoryId } from "@/lib/taxonomy/categories";
import { useState } from "react";
import {
  useChatbotCategories,
  type CategoryCardData,
} from "../hooks/useChatbotCategories";
import CategoryExpandedCard from "./CategoryExpandedCard";
import TopCategoriesKPI from "./TopCategoriesKPI";

function ChatbotCategoriesSectionContent() {
  const {
    mode,
    granularity,
    startDate,
    endDate,
    setGranularity,
    setRange,
    clearRange,
  } = useTagTimeframe();

  const { categories, isLoading, isError, error, refetch } =
    useChatbotCategories({
      granularity,
    });

  // Estado para manejar el drilldown
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<CategoryId | null>(null);

  const handleCategoryClick = (categoryId: string) => {
    console.log("Category clicked:", categoryId);
    setSelectedCategoryId(categoryId as CategoryId);
  };

  const handleBackToCategories = () => {
    setSelectedCategoryId(null);
  };

  const handleSubcategoryClick = (subcategory: string) => {
    console.log("Subcategory clicked:", subcategory);
    // Aquí se podría implementar un nivel adicional de drilldown si es necesario
  };

  return (
    <section className="max-w-[1560px] mx-auto w-full">
      <StickyHeaderSection
        title="Categorías por Tags"
        mode={mode}
        granularity={granularity}
        startDate={startDate}
        endDate={endDate}
        onGranularityChange={setGranularity}
        onRangeChange={setRange}
        onClearRange={clearRange}
      />
      
      {/* Top Categories KPI entre header y categorías */}
      <div className="px-4 mb-6">
        <TopCategoriesKPI 
          items={categories.slice(0, 4).map(cat => ({
            key: cat.id,
            value: cat.currentValue || 0,
            time: new Date().toISOString().split('T')[0]
          }))}
        />
      </div>

      {/* Drilldown expandido como overlay */}
      {selectedCategoryId && (
        <div className="px-4 mb-6">
          <CategoryExpandedCard
            categoryId={selectedCategoryId}
            granularity={granularity}
            onClose={handleBackToCategories}
            onSubcategoryClick={handleSubcategoryClick}
          />
        </div>
      )}

      {/* Grid de categorías siempre visible */}
      <div className="px-4">
        <ChatbotCategoriesGrid
          categories={categories}
          isLoading={isLoading}
          isError={isError}
          error={error}
          refetch={refetch}
          onCategoryClick={handleCategoryClick}
          selectedCategoryId={selectedCategoryId}
        />
      </div>
    </section>
  );
}

function ChatbotCategoriesGrid({
  categories,
  isLoading,
  isError,
  error,
  refetch,
  onCategoryClick,
  selectedCategoryId,
}: {
  categories: CategoryCardData[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  onCategoryClick: (categoryId: string) => void;
  selectedCategoryId: CategoryId | null;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400 mb-2">
          Error al cargar categorías
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {error?.message || "Error desconocido"}
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 dark:text-gray-400 mb-2">
          Sin datos disponibles
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-500">
          No se encontraron datos de categorías en el período seleccionado
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {categories.map((category) => (
        <ChatbotCategoryCard
          key={category.id}
          data={category}
          onCategoryClick={onCategoryClick}
          isSelected={selectedCategoryId === category.id}
        />
      ))}
    </div>
  );
}

export default function ChatbotCategoriesSection() {
  return (
    <TagTimeProvider>
      <ChatbotCategoriesSectionContent />
    </TagTimeProvider>
  );
}

function ChatbotCategoryCard({
  data,
  onCategoryClick,
  isSelected,
}: {
  data: CategoryCardData;
  onCategoryClick: (categoryId: string) => void;
  isSelected: boolean;
}) {
  return (
    <DeltaCard
      title={data.label}
      deltaPct={data.deltaPercent ?? null}
      imgSrc={data.iconSrc}
      onClick={() => onCategoryClick(data.id)}
      className={`h-full cursor-pointer transition-all ${
        isSelected
          ? "ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg bg-blue-50 dark:bg-blue-900/20"
          : "hover:shadow-lg"
      }`}
      loading={false}
    />
  );
}
