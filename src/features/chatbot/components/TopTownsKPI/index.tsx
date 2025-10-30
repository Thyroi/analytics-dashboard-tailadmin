import KPIStatGrid from "@/components/dashboard/KPIStatGrid";
import { ICONS, ITEMS_PER_PAGE, SLIDE_INTERVAL } from "./constants";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";
import type { TopTownsKPIProps } from "./types";

export default function TopTownsKPI({
  towns,
  isLoading = false,
  isError = false,
}: TopTownsKPIProps) {
  if (isError) {
    return <ErrorState />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  const kpis = towns.map((town) => ({
    title: town.label,
    value: (
      <>
        {town.currentValue.toLocaleString()}{" "}
        <span className="text-sm font-normal">Interacciones</span>
      </>
    ),
    icon: ICONS[Math.floor(Math.random() * ICONS.length)],
    color: "from-green-500 to-emerald-500",
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
