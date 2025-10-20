import KPIStatGrid from "@/components/dashboard/KPIStatGrid";
import { MapPinIcon } from "@heroicons/react/24/solid";

import { type TownCardData } from "../hooks/useChatbotTowns";

export default function TopTownsKPI({
  towns,
  isLoading = false,
  isError = false,
}: {
  towns: TownCardData[];
  isLoading?: boolean;
  isError?: boolean;
}) {
  if (isError) {
    return (
      <div className="text-red-500 text-center py-4">
        Error cargando pueblos top
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

  const kpis = towns.map((town) => ({
    title: town.label,
    value: town.currentValue,
    icon: MapPinIcon,
    color: "from-green-500 to-emerald-500",
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
