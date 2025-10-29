import type { SubcategoryInsight } from "./TownCategorySubcatDrilldownView.types";

interface TownCategorySubcatInsightsProps {
  insights: SubcategoryInsight[];
}

export default function TownCategorySubcatInsights({
  insights,
}: TownCategorySubcatInsightsProps) {
  if (insights.length === 0) return null;

  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
      {insights.map((insight, index) => (
        <div
          key={`${insight.label}-${index}-${insight.value}`}
          className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
        >
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
            #{index + 1} Subcategoría
          </div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
            {insight.label}
          </div>
          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {insight.value.toLocaleString()}
          </div>
          {insight.delta !== null && (
            <div
              className={`text-xs ${
                insight.delta > 0
                  ? "text-green-600"
                  : insight.delta < 0
                  ? "text-red-600"
                  : "text-gray-500"
              }`}
            >
              {insight.delta > 0 ? "+" : ""}
              {insight.delta.toFixed(1)}%
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
