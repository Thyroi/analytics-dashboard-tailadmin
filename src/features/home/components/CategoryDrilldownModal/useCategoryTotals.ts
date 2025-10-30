import type { CategoryId } from "@/lib/taxonomy/categories";
import type { Granularity } from "@/lib/types";
import { useResumenCategory } from "../../hooks/useResumenCategory";
import type { CategoryTotals } from "./types";

export function useCategoryTotals(
  categoryId: CategoryId,
  granularity: Granularity
): CategoryTotals {
  const { categoriesData } = useResumenCategory({ granularity });

  const categoryData = categoriesData.find(
    (item) => item.categoryId === categoryId
  );

  const ga4Total = categoryData?.ga4Value || 0;
  const chatbotTotal = categoryData?.chatbotValue || 0;
  const combinedTotal = ga4Total + chatbotTotal;

  return { ga4Total, chatbotTotal, combinedTotal };
}
