import KPIList from "@/components/charts/KPIList";
import KPIListSkeleton from "@/components/skeletons/KPIListSkeleton";
import type { KPIItem } from "@/components/charts/KPIList";

interface KPIColumnProps {
  loading: boolean;
  items: KPIItem[] | null;
  error: string | null;
}

export function KPIColumn({ loading, items, error }: KPIColumnProps) {
  if (loading || !items) {
    return <KPIListSkeleton stretch />;
  }

  if (error) {
    return (
      <div className="text-sm text-red-500 dark:text-red-400">
        Error cargando KPIs: {error}
      </div>
    );
  }

  return <KPIList items={items} stretch />;
}
