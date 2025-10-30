"use client";

import { getTownLabel } from "@/lib/taxonomy/towns";
import { X } from "lucide-react";
import { ChartsGrid } from "./ChartsGrid";
import { InfoSection } from "./InfoSection";
import { StatsGrid } from "./StatsGrid";
import type { DrilldownModalProps } from "./types";

export function DrilldownModal({
  townId,
  granularity,
  onClose,
}: DrilldownModalProps) {
  const townLabel = getTownLabel(townId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-xl font-semibold">🏘️ Drilldown: {townLabel}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            <StatsGrid townId={townId} granularity={granularity} />
            <ChartsGrid townLabel={townLabel} granularity={granularity} />
            <InfoSection />
          </div>
        </div>
      </div>
    </div>
  );
}
