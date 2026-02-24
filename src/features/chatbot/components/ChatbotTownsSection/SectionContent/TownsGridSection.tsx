import { TownGrid } from "../TownGrid";
import type { TownCardData } from "../types";

interface TownsGridSectionProps {
  towns: TownCardData[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  onRefetch: () => void;
  onTownClick: (townId: string) => void;
  selectedTownId: string | null;
}

export function TownsGridSection({
  towns,
  isLoading,
  isFetching,
  isError,
  error,
  onRefetch,
  onTownClick,
  selectedTownId,
}: TownsGridSectionProps) {
  return (
    <div className="px-4">
      <TownGrid
        towns={towns}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        error={error}
        onRefetch={onRefetch}
        onTownClick={onTownClick}
        selectedTownId={selectedTownId}
      />
    </div>
  );
}
