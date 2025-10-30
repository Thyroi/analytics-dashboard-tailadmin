import { getCategoryLabel } from "@/lib/taxonomy/categories";
import type { CategoryCardProps } from "./types";
import { getDeltaColor, getDeltaIcon } from "./utils";

export function CategoryCard({ data, onClick }: CategoryCardProps) {
  const { categoryId, ga4Value, chatbotValue, combinedValue, deltaPercentage } =
    data;
  const categoryLabel = getCategoryLabel(categoryId);

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-300 dark:hover:border-blue-600"
    >
      {/* Category Name */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
          {categoryLabel}
        </h3>
        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
          {categoryId}
        </span>
      </div>

      {/* Main Metrics */}
      <div className="space-y-3">
        {/* GA4 Value */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">GA4:</span>
          <span className="font-mono text-sm font-medium">
            {ga4Value.toLocaleString()}
          </span>
        </div>

        {/* Chatbot Value */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Chatbot:
          </span>
          <span className="font-mono text-sm font-medium">
            {chatbotValue.toLocaleString()}
          </span>
        </div>

        {/* Divider */}
        <hr className="border-gray-200 dark:border-gray-600" />

        {/* Combined Total */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Total:
          </span>
          <span className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
            {combinedValue.toLocaleString()}
          </span>
        </div>

        {/* Delta Percentage */}
        {deltaPercentage !== undefined && deltaPercentage !== null && (
          <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-500">vs período anterior:</span>
            <span
              className={`text-xs font-medium flex items-center gap-1 ${getDeltaColor(
                deltaPercentage
              )}`}
            >
              <span>{getDeltaIcon(deltaPercentage)}</span>
              <span>
                {deltaPercentage > 0 ? "+" : ""}
                {deltaPercentage.toFixed(1)}%
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
