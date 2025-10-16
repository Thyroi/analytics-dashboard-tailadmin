/**
 * Demo component para probar el nuevo formato de datos
 * basado en fechas reales del API
 */

"use client";

import type { GroupedBarSeries } from "@/components/charts/GroupedBarChart";
import GroupedBarChart from "@/components/charts/GroupedBarChart";
import { useMemo } from "react";

// Simulación de datos como los que devuelve el API
const MOCK_API_DATA = {
  "root.playas.banderas": [
    { time: "20250919", value: 2 },
    { time: "20251001", value: 1 },
  ],
  "root.playas.chiringuitos": [
    { time: "20250919", value: 2 },
    { time: "20250920", value: 13 },
  ],
  "root.playas.actividades": [
    { time: "20250920", value: 5 },
    { time: "20251001", value: 3 },
  ],
};

/**
 * Convierte fecha YYYYMMDD a YYYY-MM-DD para mostrar
 */
function formatDateForDisplay(dateString: string): string {
  if (dateString.length !== 8) return dateString;
  return `${dateString.slice(0, 4)}-${dateString.slice(
    4,
    6
  )}-${dateString.slice(6, 8)}`;
}

/**
 * Procesa datos raw en el formato que esperamos
 */
function processDataForChart(rawData: typeof MOCK_API_DATA): {
  series: GroupedBarSeries[];
  categories: string[];
} {
  // 1. Recopilar todas las fechas únicas
  const allDatesSet = new Set<string>();
  Object.values(rawData).forEach((timeSeriesArray) => {
    timeSeriesArray.forEach((point) => {
      allDatesSet.add(point.time);
    });
  });

  // 2. Ordenar fechas y convertir a formato display
  const sortedDates = Array.from(allDatesSet).sort();
  const displayDates = sortedDates.map(formatDateForDisplay);

  // 3. Crear series (una por cada subcategoría)
  const series: GroupedBarSeries[] = Object.entries(rawData).map(
    ([key, timeSeriesArray], index) => {
      // Extraer nombre limpio (quitar "root.playas.")
      const cleanName = key.replace("root.playas.", "");

      // Crear array de valores para cada fecha (0 si no hay dato)
      const dataPoints = sortedDates.map((date) => {
        const point = timeSeriesArray.find((p) => p.time === date);
        return point ? point.value : 0;
      });

      // Colores hardcodeados para demo
      const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

      return {
        name: cleanName,
        data: dataPoints,
        color: colors[index % colors.length],
      };
    }
  );

  return {
    series,
    categories: displayDates,
  };
}

export default function DateBasedGroupedBarDemo() {
  const chartData = useMemo(() => {
    return processDataForChart(MOCK_API_DATA);
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          🏖️ Demo: Gráfico Basado en Fechas Reales
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Eje X = Fechas | Barras = Subcategorías en su fecha correspondiente
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <GroupedBarChart
          title="Interacciones de Playas por Fecha"
          subtitle="Cada barra representa una subcategoría en su fecha específica"
          categories={chartData.categories}
          series={chartData.series}
          height={400}
          showLegend={true}
          tooltipFormatter={(val) => `${val} interacciones`}
          yAxisFormatter={(val) => `${val}`}
        />
      </div>

      {/* Explicación de datos */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
          📊 Explicación de los datos:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-blue-800 dark:text-blue-200 mb-2">
              <strong>Datos raw del API:</strong>
            </p>
            <pre className="bg-white dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto border">
              {JSON.stringify(MOCK_API_DATA, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-blue-800 dark:text-blue-200 mb-2">
              <strong>Resultado en el gráfico:</strong>
            </p>
            <ul className="space-y-1 text-blue-700 dark:text-blue-300">
              <li>
                • <strong>2025-09-19:</strong> banderas=2, chiringuitos=2
              </li>
              <li>
                • <strong>2025-09-20:</strong> chiringuitos=13, actividades=5
              </li>
              <li>
                • <strong>2025-10-01:</strong> banderas=1, actividades=3
              </li>
            </ul>
            <p className="mt-3 text-blue-600 dark:text-blue-400 text-xs">
              💡 Si una subcategoría no tiene datos en una fecha, su valor es 0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
