"use client";

import { CategoryCard } from "./CategoryCard";
import { EmptyState } from "./EmptyState";
import { LoadingSkeleton } from "./LoadingSkeleton";
import type { CategoryGridProps } from "./types";

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
    return <EmptyState />;
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

export type {
  CategoryCardProps,
  CategoryGridData,
  CategoryGridProps,
} from "./types";
