import type { TownCardData } from "../../hooks/useChatbotTownTotals";

export interface TopTownsKPIProps {
  towns: TownCardData[];
  isLoading?: boolean;
  isError?: boolean;
}
