"use client";

import { useResumenTown } from "@/features/home/hooks/useResumenTown";
import type { TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import { useState } from "react";
import { DrilldownModal } from "../components/DrilldownModal";
import { TownGrid } from "../components/TownGrid";

interface DebugTownsSectionContentProps {
  granularity: Granularity;
}

export default function DebugTownsSectionContent({
  granularity,
}: DebugTownsSectionContentProps) {
  const [selectedTownId, setSelectedTownId] = useState<TownId | null>(null);

  // Usar el hook optimizado
  const townResumenResult = useResumenTown({ granularity });

  const handleTownClick = (townId: TownId) => {
    setSelectedTownId(townId);
  };

  const handleCloseDrilldown = () => {
    setSelectedTownId(null);
  };

  if (townResumenResult.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Cargando datos de pueblos...</div>
      </div>
    );
  }

  if (townResumenResult.isError) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">
          Error cargando datos: {townResumenResult.error?.message}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">📊 Debug Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">
              Total Towns:
            </span>
            <div className="font-mono">{townResumenResult.data.length}</div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">
              Towns with Data:
            </span>
            <div className="font-mono">
              {townResumenResult.data.filter((t) => t.combinedTotal > 0).length}
            </div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">
              Granularity:
            </span>
            <div className="font-mono">{granularity}</div>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">API Calls:</span>
            <div className="font-mono text-green-600">2 (optimized!)</div>
          </div>
        </div>
      </div>

      {/* Town Grid */}
      <TownGrid
        data={townResumenResult.data}
        onTownClick={handleTownClick}
        isLoading={townResumenResult.isLoading}
      />

      {/* Drilldown Modal */}
      {selectedTownId && (
        <DrilldownModal
          townId={selectedTownId}
          granularity={granularity}
          onClose={handleCloseDrilldown}
        />
      )}
    </div>
  );
}
