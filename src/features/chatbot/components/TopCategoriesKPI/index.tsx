import KPIStatGrid from "@/components/dashboard/KPIStatGrid";
import type { TopCategoriesKPIProps } from "./types";
import { ICONS, SLIDE_INTERVAL, ITEMS_PER_PAGE } from "./constants";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";

export default function TopCategoriesKPI({
  categories,
  isLoading = false,
  isError = false,
}: TopCategoriesKPIProps) {
  if (isError) {
    return <ErrorState />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  const kpis = categories.map((category) => ({
    title: category.label,
    value: (
      <>
        {category.currentValue.toLocaleString()}{" "}
        <span className="text-sm font-normal">Interacciones</span>
      </>
    ),
    icon: ICONS[Math.floor(Math.random() * ICONS.length)],
    color: "from-blue-500 to-indigo-500",
  }));

  return (
    <KPIStatGrid
      items={kpis}
      infiniteRow={true}
      itemsPerPage={ITEMS_PER_PAGE}
      autoSlide={true}
      slideInterval={SLIDE_INTERVAL}
      className="mb-6"
    />
  );
}
