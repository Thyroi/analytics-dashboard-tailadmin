import TownCard from "../TownCard";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { LoadingGrid } from "./LoadingGrid";
import type { TownGridProps } from "./types";

export function TownGrid({
  towns,
  isLoading,
  isError,
  error,
  onRefetch,
  onTownClick,
  selectedTownId,
}: TownGridProps) {
  if (isLoading) {
    return <LoadingGrid />;
  }

  if (isError) {
    return <ErrorState error={error} onRetry={onRefetch} />;
  }

  if (towns.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {towns.map((town) => (
        <TownCard
          key={town.id}
          data={town}
          onClick={() => onTownClick(town.id)}
          isSelected={selectedTownId === town.id}
        />
      ))}
    </div>
  );
}
