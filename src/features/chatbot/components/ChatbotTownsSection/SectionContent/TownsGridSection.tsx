import { TownGrid } from "../TownGrid";
import type { TownCardData } from "../types";

interface TownsGridSectionProps {
  towns: TownCardData[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  onRefetch: () => void;
  onTownClick: (townId: string) => void;
  selectedTownId: string | null;
}

export function TownsGridSection({
  towns,
  isLoading,
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
        isError={isError}
        error={error}
        onRefetch={onRefetch}
        onTownClick={onTownClick}
        selectedTownId={selectedTownId}
      />
    </div>
  );
}
