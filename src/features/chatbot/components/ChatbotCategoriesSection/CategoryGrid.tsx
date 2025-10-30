import { CategoryCard } from "./CategoryCard";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { LoadingGrid } from "./LoadingGrid";
import type { CategoryGridProps } from "./types";

export function CategoryGrid({
  categories,
  isLoading,
  isError,
  error,
  refetch,
  onCategoryClick,
  selectedCategoryId,
}: CategoryGridProps) {
  if (isLoading) {
    return <LoadingGrid />;
  }

  if (isError) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  if (categories.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          data={category}
          onCategoryClick={onCategoryClick}
          isSelected={selectedCategoryId === category.id}
        />
      ))}
    </div>
  );
}
