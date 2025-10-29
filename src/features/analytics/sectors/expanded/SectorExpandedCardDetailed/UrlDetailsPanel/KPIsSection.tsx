import KPIList, { type KPIItem } from "@/components/charts/KPIList";
import KPIListSkeleton from "@/components/skeletons/KPIListSkeleton";
import DrilldownTitle from "../DrilldownTitle";

type KPIsSectionProps = {
  items: KPIItem[] | null;
};

export function KPIsSection({ items }: KPIsSectionProps) {
  return (
    <section className="mb-6">
      <DrilldownTitle name="indicadores clave" color="dark" />
      <div className="mt-3">
        {!items ? (
          <KPIListSkeleton stretch />
        ) : (
          <KPIList items={items} direction="horizontal" className="w-full" />
        )}
      </div>
    </section>
  );
}
