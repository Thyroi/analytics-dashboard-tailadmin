/**
 * Componente de tarjeta para mostrar métricas de chatbot
 * Según especificaciones del prompt maestro
 */

"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import type { ChatbotCardData } from "../types";

export type ChatbotCardProps = {
  data: ChatbotCardData;
  granularity: "d" | "w" | "m" | "y";
  onClick?: () => void;
  className?: string;
};

const GRANULARITY_LABELS = {
  d: "Ayer vs Anteayer",
  w: "Esta semana vs Anterior",
  m: "Este mes vs Anterior",
  y: "Este año vs Anterior",
} as const;

export default function ChatbotCard({
  data,
  granularity,
  onClick,
  className = "",
}: ChatbotCardProps) {
  const { label, currentTotal, prevTotal, deltaAbs, deltaPct } = data;

  // Determinar color y icono del delta
  const deltaColor =
    deltaAbs > 0
      ? "text-green-600 dark:text-green-400"
      : deltaAbs < 0
      ? "text-red-600 dark:text-red-400"
      : "text-gray-500 dark:text-gray-400";

  const DeltaIcon =
    deltaAbs > 0 ? TrendingUp : deltaAbs < 0 ? TrendingDown : Minus;

  // Formatear porcentaje
  const formatPercentage = (pct: number | null): string => {
    if (pct === null) return "N/A";
    const sign = pct > 0 ? "+" : "";
    return `${sign}${(pct * 100).toFixed(1)}%`;
  };

  const isClickable = typeof onClick === "function";

  return (
    <motion.div
      whileHover={isClickable ? { scale: 1.02, y: -2 } : undefined}
      whileTap={isClickable ? { scale: 0.98 } : undefined}
      className={`
        rounded-xl border bg-white p-4 transition-all duration-200
        border-gray-200 hover:border-red-300 hover:shadow-md
        dark:bg-[#0b0f14] dark:border-white/10 dark:hover:border-red-400/30
        ${isClickable ? "cursor-pointer" : "cursor-default"}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Header */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {label}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {GRANULARITY_LABELS[granularity]}
        </p>
      </div>

      {/* Métricas principales */}
      <div className="space-y-2">
        {/* Total actual */}
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentTotal.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Preguntas actuales
          </div>
        </div>

        {/* Delta */}
        <div className="flex items-center gap-2">
          <DeltaIcon className={`h-4 w-4 ${deltaColor}`} />
          <span className={`text-sm font-medium ${deltaColor}`}>
            {deltaAbs > 0 ? "+" : ""}
            {deltaAbs.toLocaleString()}
          </span>
          {deltaPct !== null && (
            <span className={`text-sm ${deltaColor}`}>
              ({formatPercentage(deltaPct)})
            </span>
          )}
        </div>

        {/* Comparación con período anterior */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          vs {prevTotal.toLocaleString()} anterior
        </div>
      </div>

      {/* Indicador de clickeable */}
      {isClickable && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/10">
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <span>Ver detalles</span>
            <span className="text-red-500">→</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
