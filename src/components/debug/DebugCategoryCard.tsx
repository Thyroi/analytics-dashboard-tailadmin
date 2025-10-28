"use client";

import type { CategoryId } from "@/lib/taxonomy/categories";
import { CATEGORY_META } from "@/lib/taxonomy/categories";

interface DebugCategoryCardProps {
  categoryId: CategoryId;
  ga4Current: number;
  ga4Previous: number;
  chatbotCurrent: number;
  chatbotPrevious: number;
  combined: number;
  delta: number;
  deltaPct: number | null;
  onClick?: () => void;
}

export default function DebugCategoryCard({
  categoryId,
  ga4Current,
  ga4Previous,
  chatbotCurrent,
  chatbotPrevious,
  combined,
  delta,
  deltaPct,
  onClick,
}: DebugCategoryCardProps) {
  const categoryMeta = CATEGORY_META[categoryId];

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow border ${
        onClick ? "cursor-pointer hover:shadow-lg transition-shadow" : ""
      }`}
    >
      {/* Header con nombre de la categoría */}
      <div className="flex items-center gap-2 mb-3">
        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
          {categoryMeta.label}
        </h4>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
          {categoryId}
        </span>
      </div>

      {/* Datos de GA4 */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-300">GA4 Current:</span>
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {ga4Current.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-300">
            GA4 Previous:
          </span>
          <span className="font-semibold text-blue-500 dark:text-blue-300">
            {ga4Previous.toLocaleString()}
          </span>
        </div>

        {/* Datos del Chatbot */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-300">
            Chatbot Current:
          </span>
          <span className="font-semibold text-green-600 dark:text-green-400">
            {chatbotCurrent.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-300">
            Chatbot Previous:
          </span>
          <span className="font-semibold text-green-500 dark:text-green-300">
            {chatbotPrevious.toLocaleString()}
          </span>
        </div>

        {/* Separator */}
        <hr className="border-gray-200 dark:border-gray-600 my-2" />

        {/* Combined Total */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-300 font-medium">
            Combined:
          </span>
          <span className="font-bold text-purple-600 dark:text-purple-400">
            {combined.toLocaleString()}
          </span>
        </div>

        {/* Delta */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-300">Delta:</span>
          <span className="font-semibold text-gray-500">
            {delta.toLocaleString()}
          </span>
        </div>

        {/* Delta Percentage */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-300">Delta %:</span>
          <span className="font-semibold text-gray-500">
            {deltaPct !== null ? `${deltaPct.toFixed(1)}%` : "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
}
