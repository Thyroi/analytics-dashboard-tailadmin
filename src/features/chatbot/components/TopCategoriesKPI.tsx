import KPIStatGrid from "@/components/dashboard/KPIStatGrid";
import { ChartBarIcon } from "@heroicons/react/24/solid";

import { type CategoryCardData } from "../hooks/useChatbotCategories";

export default function TopCategoriesKPI({
  categories,
  isLoading = false,
  isError = false,
}: {
  categories: CategoryCardData[];
  isLoading?: boolean;
  isError?: boolean;
}) {
  if (isError) {
    return (
      <div className="text-red-500 text-center py-4">
        Error cargando categorías top
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
      </div>
    );
  }

  const kpis = categories.map((category) => ({
    title: category.label,
    value: category.currentValue,
    icon: ChartBarIcon,
    color: "from-blue-500 to-indigo-500",
  }));

  return (
    <KPIStatGrid
      items={kpis}
      infiniteRow={true}
      itemsPerPage={4}
      autoSlide={true}
      slideInterval={5000}
      className="mb-6"
    />
  );
}
