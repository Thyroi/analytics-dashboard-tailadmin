"use client";

import type { TownId } from "@/lib/taxonomy/towns";
import { getTownLabel } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import { X } from "lucide-react";

interface DrilldownModalProps {
  townId: TownId;
  granularity: Granularity;
  onClose: () => void;
}

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
            {/* Stats Section */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">📊 Estadísticas del Pueblo</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Granularity:
                  </span>
                  <div className="font-mono">{granularity}</div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Town ID:
                  </span>
                  <div className="font-mono">{townId}</div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Pattern:
                  </span>
                  <div className="font-mono text-xs">root.{townId}.*</div>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Status:
                  </span>
                  <div className="font-mono text-green-600">✅ Ready</div>
                </div>
              </div>
            </div>

            {/* Placeholder Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Placeholder */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h4 className="font-semibold mb-4">📈 Gráfica 1: Categorías</h4>
                <div className="h-64 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-blue-600 dark:text-blue-300">
                    <div className="text-4xl mb-2">📊</div>
                    <div className="font-medium">Gráfica de categorías</div>
                    <div className="text-sm opacity-75">Para {townLabel}</div>
                  </div>
                </div>
              </div>

              {/* Chart 2: Placeholder */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h4 className="font-semibold mb-4">
                  📊 Gráfica 2: Serie Temporal
                </h4>
                <div className="h-64 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-green-600 dark:text-green-300">
                    <div className="text-4xl mb-2">📈</div>
                    <div className="font-medium">Serie temporal</div>
                    <div className="text-sm opacity-75">
                      Granularidad: {granularity}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-semibold mb-3 text-blue-800 dark:text-blue-200">
                🎯 Modal de Debug Funcional
              </h4>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                <p>✅ Modal se abre al hacer click en las cards</p>
                <p>✅ Muestra información del pueblo seleccionado</p>
                <p>✅ Estructura lista para integrar gráficas reales</p>
                <p>✅ Responsive y accesible</p>
                <p className="mt-3 font-medium">
                  🚀 ¡La estructura funciona igual que SectorsByTagSection!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
