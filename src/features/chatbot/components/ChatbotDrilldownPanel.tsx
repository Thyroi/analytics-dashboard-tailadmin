/**
 * Panel de drill-down para chatbot según especificaciones del prompt maestro
 * Incluye gráfica comparativa y donut de distribución
 */

"use client";

import LineChart from "@/components/charts/LineChart";
import DonutCard from "@/components/dashboard/DonutCard";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { DrilldownData, Granularity, ViewMode } from "../types";

export type ChatbotDrilldownPanelProps = {
  data: DrilldownData;
  granularity: Granularity;
  mode: ViewMode;
  isOpen: boolean;
  onClose: () => void;
};

const GRANULARITY_LABELS = {
  d: "Días",
  w: "Semanas",
  m: "Meses",
  y: "Años",
} as const;

export default function ChatbotDrilldownPanel({
  data,
  granularity,
  mode,
  isOpen,
  onClose,
}: ChatbotDrilldownPanelProps) {
  if (!isOpen) return null;

  const {
    label,
    currentSeries,
    previousSeries,
    donutData,
    currentTotal,
    prevTotal,
  } = data;

  // Preparar datos para el gráfico de líneas
  const chartCategories = currentSeries.map((point) =>
    formatTimeLabel(point.time, granularity)
  );
  const currentData = currentSeries.map((point) => point.value);
  const previousData = previousSeries.map((point) => point.value);

  // Calcular delta
  const deltaAbs = currentTotal - prevTotal;
  const deltaPct = prevTotal > 0 ? (deltaAbs / prevTotal) * 100 : null;

  // Título del donut según el modo
  const donutTitle =
    mode === "byCategory"
      ? "Distribución por Pueblos"
      : "Distribución por Categorías";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-[#0b0f14] rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {label}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Análisis detallado por{" "}
                {GRANULARITY_LABELS[granularity].toLowerCase()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentTotal.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Período Actual
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {prevTotal.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Período Anterior
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-4">
                <div
                  className={`text-2xl font-bold ${
                    deltaAbs > 0
                      ? "text-green-600 dark:text-green-400"
                      : deltaAbs < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {deltaAbs > 0 ? "+" : ""}
                  {deltaAbs.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Cambio{" "}
                  {deltaPct !== null ? `(${deltaPct.toFixed(1)}%)` : "(N/A)"}
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Line Chart */}
              <div className="bg-white dark:bg-[#0b0f14] rounded-xl border border-gray-200 dark:border-white/10 p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Tendencia Temporal
                </h3>
                <LineChart
                  categories={chartCategories}
                  series={[
                    {
                      name: "Período Actual",
                      data: currentData,
                    },
                    {
                      name: "Período Anterior",
                      data: previousData,
                    },
                  ]}
                  height={300}
                  showLegend={true}
                  palette={["#E55338", "#94A3B8"]}
                />
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Comparación período actual vs anterior (to-date)
                </div>
              </div>

              {/* Donut Chart */}
              <div>
                <DonutCard
                  title={donutTitle}
                  items={donutData.map((item) => ({
                    label: item.label,
                    value: item.value,
                    color: item.color,
                  }))}
                  centerTitle="Total"
                  centerValueOverride={currentTotal}
                  height={300}
                  variant="plain"
                  className="bg-white dark:bg-[#0b0f14] rounded-xl border border-gray-200 dark:border-white/10"
                />
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Información de la consulta
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div>
                  <strong>Pattern:</strong> {data.pattern}
                </div>
                <div>
                  <strong>Granularidad:</strong>{" "}
                  {GRANULARITY_LABELS[granularity]}
                </div>
                <div>
                  <strong>Tipo:</strong>{" "}
                  {mode === "byCategory" ? "Por Categoría" : "Por Pueblo"}
                </div>
                <div>
                  <strong>Series actuales:</strong> {currentSeries.length}{" "}
                  puntos de datos
                </div>
                <div>
                  <strong>Elementos en donut:</strong> {donutData.length}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Formatea etiquetas de tiempo según granularidad
 */
function formatTimeLabel(time: string, granularity: Granularity): string {
  if (time.length === 8) {
    // yyyymmdd
    const year = time.slice(0, 4);
    const month = time.slice(4, 6);
    const day = time.slice(6, 8);

    switch (granularity) {
      case "d":
        return `${day}/${month}`;
      case "w":
        return `${day}/${month}`;
      case "m":
        return `${month}/${year.slice(2)}`;
      case "y":
        return year;
      default:
        return time;
    }
  }

  return time;
}
