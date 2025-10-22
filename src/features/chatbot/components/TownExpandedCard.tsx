import ChartPair from "@/components/common/ChartPair";
import { useMemo } from "react";

import { TOWN_META, type TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import { useChatbotTownDetails } from "../hooks/useChatbotTownDetails";

type Props = {
  townId: string;
  granularity: Granularity;
  startDate?: string | null;
  endDate?: string | null;
  onClose: () => void;
};

function Header({
  title,
  subtitle,
  imgSrc,
  onClose,
}: {
  title: string;
  subtitle: string;
  imgSrc?: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center space-x-3">
        {imgSrc && (
          <div className="flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt={title}
              className="w-8 h-8 rounded-lg object-cover"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        </div>
      </div>

      <button
        onClick={onClose}
        className="flex-shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        aria-label="Cerrar"
      >
        <svg
          className="w-5 h-5 text-gray-500 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

export default function TownExpandedCard({
  townId,
  granularity,
  startDate,
  endDate,
  onClose,
}: Props) {
  // Removed selectedSlice functionality

  // Obtener detalles del town usando nuestro hook específico
  const { series, donutData, totalInteractions, error } = useChatbotTownDetails(
    {
      townId: townId as TownId,
      granularity,
      startDate,
      endDate,
      enabled: true,
    }
  );

  const townMeta = TOWN_META[townId as TownId];
  const townLabel = townMeta?.label || townId;
  const townIcon = townMeta?.iconSrc;

  // Convertir series para ChartPair
  const lineSeriesData = useMemo(() => {
    return series.current.map((point) => ({
      label: point.label,
      value: point.value,
    }));
  }, [series]);

  // Subtítulo con información detallada
  const subtitle = `Análisis detallado por categorías • ${totalInteractions.toLocaleString()} interacciones totales`;

  const handleDonutSlice = (label: string) => {
    // Removed selectedSlice functionality - no action needed
    console.log('Donut slice clicked:', label);
  };

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <Header
          title="Error cargando datos"
          subtitle={error.message}
          onClose={onClose}
        />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header con X para cerrar */}
      <Header
        title={townLabel}
        subtitle={subtitle}
        imgSrc={townIcon}
        onClose={onClose}
      />

      {/* Removed selectedSlice information section */}

      {/* Gráficas */}
      <div className="px-4">
        <ChartPair
          mode="line"
          series={{
            current: lineSeriesData,
            previous: [],
          }}
          donutData={donutData}
          deltaPct={null}
          onDonutSlice={handleDonutSlice}
          donutCenterLabel={townLabel}
          showActivityButton={false}
          actionButtonTarget={`/chatbot/town/${townId}/activity`}
          className=""
        />
      </div>
    </div>
  );
}
