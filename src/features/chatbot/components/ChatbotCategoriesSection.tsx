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
import { useRef, useState } from "react";
import {
  useChatbotCategoryHandlers,
  useChatbotCategoryTotals,
  type CategoryCardData,
} from "../hooks/useChatbotCategoryTotals";
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
    getCalculatedGranularity,
  } = useTagTimeframe();

  // Obtener handlers para invalidación/refetch
  const handlers = useChatbotCategoryHandlers();

  // Convertir fechas de manera segura
  let startDateStr: string | null = null;
  let endDateStr: string | null = null;

  try {
    startDateStr =
      startDate instanceof Date && !isNaN(startDate.getTime())
        ? startDate.toISOString().split("T")[0]
        : null;
    endDateStr =
      endDate instanceof Date && !isNaN(endDate.getTime())
        ? endDate.toISOString().split("T")[0]
        : null;
  } catch (error) {
    console.error("Error converting dates:", { startDate, endDate, error });
    startDateStr = null;
    endDateStr = null;
  }

  // Hook principal con React Query (sin useEffect)
  const effectiveGranularity = getCalculatedGranularity();

  const { categories, isLoading, isError, error, refetch } =
    useChatbotCategoryTotals({
      granularity: effectiveGranularity,
      startDate: startDateStr,
      endDate: endDateStr,
    });

  // Estado para manejar el drilldown
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<CategoryId | null>(null);

  // Ref para hacer scroll al drilldown
  const drilldownRef = useRef<HTMLDivElement>(null);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId as CategoryId);

    // Scroll automático usando requestAnimationFrame para mejor performance
    requestAnimationFrame(() => {
      drilldownRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    });
  };

  const handleBackToCategories = () => {
    setSelectedCategoryId(null);
  };

  return (
    <section className="max-w-[1560px] mx-auto w-full">
      <StickyHeaderSection
        title="Categorías por Tags"
        mode={mode}
        granularity={granularity}
        startDate={startDate}
        endDate={endDate}
        onGranularityChange={(newGranularity) => {
          setGranularity(newGranularity);
          handlers.onGranularityChange();
        }}
        onRangeChange={(start, end) => {
          setRange(start, end);
          handlers.onRangeChange();
        }}
        onClearRange={() => {
          clearRange();
          handlers.onClearRange();
        }}
      />

      {/* Top Categories KPI entre header y categorías */}
      <div className="px-4 mb-6">
        <TopCategoriesKPI
          categories={categories.slice(0, 8)}
          isLoading={isLoading}
          isError={isError}
        />
      </div>

      {/* Drilldown expandido como overlay */}
      {selectedCategoryId && (
        <div ref={drilldownRef} className="px-4 mb-6">
          <CategoryExpandedCard
            categoryId={selectedCategoryId}
            granularity={effectiveGranularity}
            startDate={startDateStr}
            endDate={endDateStr}
            onClose={handleBackToCategories}
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
