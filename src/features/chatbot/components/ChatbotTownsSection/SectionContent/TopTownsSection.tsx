import TopTownsKPI from "../../TopTownsKPI";
import type { TownCardData } from "../types";
import { TOP_TOWNS_COUNT } from "./constants";

interface TopTownsSectionProps {
  towns: TownCardData[];
  isLoading: boolean;
  isError: boolean;
}

export function TopTownsSection({
  towns,
  isLoading,
  isError,
}: TopTownsSectionProps) {
  return (
    <div className="px-4 mb-6">
      <TopTownsKPI
        towns={towns.slice(0, TOP_TOWNS_COUNT)}
        isLoading={isLoading}
        isError={isError}
      />
    </div>
  );
}
