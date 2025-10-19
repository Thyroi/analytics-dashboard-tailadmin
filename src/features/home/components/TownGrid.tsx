"use client";

import type { TownGridData } from "@/features/home/hooks/useResumenTown";
import type { TownId } from "@/lib/taxonomy/towns";

interface TownCardProps {
  data: TownGridData;
  onClick: () => void;
}

function TownCard({ data, onClick }: TownCardProps) {
  const deltaColor =
    data.combinedDeltaPct === null
      ? "text-gray-500"
      : data.combinedDeltaPct > 0
      ? "text-green-600"
      : "text-red-600";

  const deltaText =
    data.combinedDeltaPct === null
      ? "Sin datos"
      : `${data.combinedDeltaPct > 0 ? "+" : ""}${data.combinedDeltaPct.toFixed(
          1
        )}%`;

  return (
    <div
      className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <h3 className="font-semibold mb-3 text-lg">{data.title}</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>GA4 Total:</span>
          <span className="font-mono">{data.ga4Total}</span>
        </div>

        <div className="flex justify-between">
          <span>GA4 Previous:</span>
          <span className="font-mono">{data.ga4Previous}</span>
        </div>

        <div className="flex justify-between">
          <span>Chatbot Total:</span>
          <span className="font-mono">{data.chatbotTotal}</span>
        </div>

        <div className="flex justify-between">
          <span>Chatbot Previous:</span>
          <span className="font-mono">{data.chatbotPrevious}</span>
        </div>

        <hr className="border-gray-200 dark:border-gray-600" />

        <div className="flex justify-between font-semibold">
          <span>Combined Total:</span>
          <span className="font-mono">{data.combinedTotal}</span>
        </div>

        <div className="flex justify-between">
          <span>Delta:</span>
          <span className={`font-mono ${deltaColor}`}>{deltaText}</span>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500 text-center">
        Click para ver drilldown →
      </div>
    </div>
  );
}

interface TownGridProps {
  data: TownGridData[];
  onTownClick: (townId: TownId) => void;
  isLoading?: boolean;
}

export function TownGrid({ data, onTownClick, isLoading }: TownGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="border rounded-lg p-4 bg-gray-100 dark:bg-gray-700 animate-pulse"
          >
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-3"></div>
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, j) => (
                <div
                  key={j}
                  className="h-4 bg-gray-300 dark:bg-gray-600 rounded"
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {data.map((townData) => (
        <TownCard
          key={townData.id}
          data={townData}
          onClick={() => onTownClick(townData.id as TownId)}
        />
      ))}
    </div>
  );
}
