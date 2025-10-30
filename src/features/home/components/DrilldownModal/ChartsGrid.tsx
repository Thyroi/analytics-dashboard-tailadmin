import type { Granularity } from "@/lib/types";

interface ChartsGridProps {
  townLabel: string;
  granularity: Granularity;
}

export function ChartsGrid({ townLabel, granularity }: ChartsGridProps) {
  return (
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
        <h4 className="font-semibold mb-4">📊 Gráfica 2: Serie Temporal</h4>
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
  );
}
