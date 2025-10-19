"use client";

import type { CategoryId } from "@/lib/taxonomy/categories";
import { getCategoryLabel } from "@/lib/taxonomy/categories";

export interface CategoryGridData {
  categoryId: CategoryId;
  ga4Value: number;
  chatbotValue: number;
  combinedValue: number;
  deltaPercentage?: number | null;
}

interface CategoryGridProps {
  data: CategoryGridData[];
  onCategoryClick: (categoryId: CategoryId) => void;
  isLoading: boolean;
}

interface CategoryCardProps {
  data: CategoryGridData;
  onClick: () => void;
}

function CategoryCard({ data, onClick }: CategoryCardProps) {
  const { categoryId, ga4Value, chatbotValue, combinedValue, deltaPercentage } =
    data;
  const categoryLabel = getCategoryLabel(categoryId);

  // Delta color logic
  const getDeltaColor = (delta: number | null | undefined) => {
    if (delta === undefined || delta === null || delta === 0)
      return "text-gray-500";
    return delta > 0 ? "text-green-600" : "text-red-600";
  };

  const getDeltaIcon = (delta: number | null | undefined) => {
    if (delta === undefined || delta === null || delta === 0) return "→";
    return delta > 0 ? "↗" : "↘";
  };

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

function LoadingSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
          </div>
          <hr className="border-gray-200 dark:border-gray-600" />
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-10"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CategoryGrid({
  data,
  onCategoryClick,
  isLoading,
}: CategoryGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <LoadingSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay datos de categorías
          </h3>
          <p className="text-gray-500">
            No se encontraron datos para el período seleccionado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {data.map((categoryData) => (
        <CategoryCard
          key={categoryData.categoryId}
          data={categoryData}
          onClick={() => onCategoryClick(categoryData.categoryId)}
        />
      ))}
    </div>
  );
}
