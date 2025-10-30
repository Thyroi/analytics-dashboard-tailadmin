import type { CategoryCardData } from "../../hooks/useChatbotCategoryTotals";

export interface TopCategoriesKPIProps {
  categories: CategoryCardData[];
  isLoading?: boolean;
  isError?: boolean;
}
