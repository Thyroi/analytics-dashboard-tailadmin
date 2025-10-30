import { CustomersDemographicsSkeleton } from "@/features/analytics/skeletons";
import { CARD_CLASS, MAP_HEIGHT } from "./constants";

export function LoadingState() {
  return (
    <CustomersDemographicsSkeleton
      mapHeight={MAP_HEIGHT}
      className={CARD_CLASS}
    />
  );
}
