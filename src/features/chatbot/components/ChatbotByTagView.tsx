/**
 * Componente principal para vista Chatbot con drill-down completo
 * Según especificaciones del prompt maestro
 */

"use client";

import Header from "@/components/common/Header";
import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { useChatbotByTag, useChatbotDrilldown } from "../hooks/useChatbotByTag";
import type { ComparisonMode, Granularity, ViewMode } from "../types";
import ChatbotCard from "./ChatbotCard";
import ChatbotCardSkeleton from "./ChatbotCardSkeleton";
import ChatbotDrilldownPanel from "./ChatbotDrilldownPanel";
import ChatbotDrilldownSkeleton from "./ChatbotDrilldownSkeleton";

export type ChatbotByTagProps = {
  mode: ViewMode;
  granularity: Granularity;
  categories?: string[];
  towns?: string[];
  comparisonMode?: ComparisonMode;
  className?: string;
};

const MODE_TITLES = {
  byCategory: "Preguntas por Categoría",
  byTown: "Preguntas por Pueblo",
} as const;

const GRANULARITY_DESCRIPTIONS = {
  d: "Comparación diaria (ayer vs anteayer)",
  w: "Comparación semanal (actual vs anterior, hasta la fecha)",
  m: "Comparación mensual (actual vs anterior, hasta la fecha)",
  y: "Comparación anual (actual vs anterior, hasta la fecha)",
} as const;

export default function ChatbotByTag({
  mode,
  granularity,
  categories = [],
  towns = [],
  comparisonMode = "toDate",
  className = "",
}: ChatbotByTagProps) {
  const [selectedCard, setSelectedCard] = useState<{
    id: string;
    label: string;
  } | null>(null);

  // Hook principal para tarjetas
  const { cards, state, error, period, refresh } = useChatbotByTag({
    mode,
    granularity,
    categories,
    towns,
    comparisonMode,
  });

  // Hook para drill-down
  const drilldown = useChatbotDrilldown({
    cardId: selectedCard?.id || "",
    cardLabel: selectedCard?.label || "",
    mode,
    granularity,
    period,
  });

  // Manejadores
  const handleCardClick = (cardId: string, cardLabel: string) => {
    setSelectedCard({ id: cardId, label: cardLabel });
  };

  const handleCloseDrilldown = () => {
    setSelectedCard(null);
  };

  // Determinar si mostrar el panel
  const showDrilldownPanel =
    selectedCard && drilldown.state === "success" && drilldown.data;
  const showDrilldownSkeleton = selectedCard && drilldown.state === "loading";

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Header
            title={MODE_TITLES[mode]}
            subtitle={GRANULARITY_DESCRIPTIONS[granularity]}
            Icon={MessageCircle}
            titleSize="lg"
          />
        </div>

        {state === "success" && (
          <button
            onClick={refresh}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Actualizar
          </button>
        )}
      </div>

      {/* Content */}
      <div>
        {/* Loading State */}
        {state === "loading" && (
          <ChatbotCardSkeleton
            count={mode === "byCategory" ? categories.length : towns.length}
          />
        )}

        {/* Error State */}
        {state === "error" && (
          <div className="text-center py-12">
            <div className="text-red-600 dark:text-red-400 mb-2">
              Error al cargar datos
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </div>
            <button
              onClick={refresh}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Empty State */}
        {state === "empty" && (
          <div className="text-center py-12">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-600 dark:text-gray-400 mb-2">
              Sin datos disponibles
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-500">
              No se encontraron preguntas en el período seleccionado
            </div>
          </div>
        )}

        {/* Success State */}
        {state === "success" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => (
              <ChatbotCard
                key={card.id}
                data={card}
                granularity={granularity}
                onClick={() => handleCardClick(card.id, card.label)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Drill-down Panel */}
      {showDrilldownPanel && (
        <ChatbotDrilldownPanel
          data={drilldown.data!}
          granularity={granularity}
          mode={mode}
          isOpen={true}
          onClose={handleCloseDrilldown}
        />
      )}

      {/* Drill-down Skeleton */}
      {showDrilldownSkeleton && (
        <ChatbotDrilldownSkeleton
          isOpen={true}
          onClose={handleCloseDrilldown}
          title={selectedCard?.label}
        />
      )}

      {/* Drill-down Error */}
      {selectedCard && drilldown.state === "error" && (
        <ChatbotDrilldownSkeleton
          isOpen={true}
          onClose={handleCloseDrilldown}
          title={`Error: ${selectedCard.label}`}
        />
      )}
    </div>
  );
}
