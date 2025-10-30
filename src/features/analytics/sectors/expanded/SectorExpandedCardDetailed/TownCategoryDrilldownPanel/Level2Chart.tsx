import ChartPair from "@/components/common/ChartPair";
import ChartPairSkeleton from "@/components/skeletons/ChartPairSkeleton";
import type { Granularity } from "@/lib/types";
import type { DayData } from "./types";

type Level2ChartProps = {
  isDayGranularity: boolean;
  dayData: DayData | null;
  drilldownLoading: boolean;
  ddLoading: boolean;
  ddXLabels: string[];
  ddSeriesByUrl: Array<{ name: string; path: string; data: number[] }>;
  ddDonut: Array<{ label: string; value: number }>;
  ddDeltaPct: number;
  ddColorsByName: Record<string, string>;
  granularity: Granularity;
  onDonutSliceClick: (path: string) => void;
};

export function Level2Chart({
  isDayGranularity,
  dayData,
  drilldownLoading,
  ddLoading,
  ddXLabels,
  ddSeriesByUrl,
  ddDonut,
  ddDeltaPct,
  ddColorsByName,
  granularity,
  onDonutSliceClick,
}: Level2ChartProps) {
  if (drilldownLoading) {
    return <ChartPairSkeleton />;
  }

  if (isDayGranularity && dayData) {
    // Para granularidad día: múltiples barras (una por URL) en cada fecha
    return (
      <ChartPair
        mode="grouped"
        categories={dayData.categories}
        groupedSeries={dayData.groupedSeries}
        chartTitle="Comparación por sub-categorías"
        chartSubtitle="Cada fecha muestra todas las sub-categorías"
        chartHeight={400}
        tooltipFormatter={(val) => val.toLocaleString()}
        yAxisFormatter={(val) => val.toString()}
        legendPosition="bottom"
        donutData={dayData.donut}
        deltaPct={dayData.deltaPct}
        onDonutSlice={onDonutSliceClick}
        donutCenterLabel="Interacciones"
        actionButtonTarget="actividad"
        granularity={granularity}
      />
    );
  }

  if (ddLoading) {
    return <ChartPairSkeleton />;
  }

  // Para otras granularidades: comparación por URLs
  return (
    <ChartPair
      mode="multi"
      xLabels={ddXLabels}
      seriesBySub={ddSeriesByUrl}
      loading={ddLoading}
      donutData={ddDonut}
      deltaPct={ddDeltaPct}
      onDonutSlice={onDonutSliceClick}
      donutCenterLabel="Interacciones"
      actionButtonTarget="actividad"
      colorsByName={ddColorsByName}
      granularity={granularity}
    />
  );
}
