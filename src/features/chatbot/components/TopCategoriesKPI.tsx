import KPIStatGrid from "@/components/dashboard/KPIStatGrid";
import { ChartBarIcon } from "@heroicons/react/24/solid";

export default function TopCategoriesKPI({
  items,
}: {
  items: { key: string; value: number; time: string }[];
}) {
  const kpis = items.map((item) => ({
    title: item.key.replace("root.", ""),
    value: item.value,
    icon: ChartBarIcon,
    color: "from-blue-500 to-indigo-500",
  }));
  return (
    <div className="w-full h-[350px]">
      <KPIStatGrid
        items={kpis}
        infiniteRow={true}
        itemsPerPage={4}
        className="mb-6"
      />
    </div>
  );
}
