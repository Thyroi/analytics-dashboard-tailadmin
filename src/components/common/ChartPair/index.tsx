"use client";

import DrilldownMultiLineSection from "@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/DrilldownMultiLineSection";
import { ChartPairLayout } from "./ChartPairLayout";
import { DonutSide } from "./DonutSide";
import { GroupedBarSide } from "./GroupedBarSide";
import { shouldUseGroupedBar } from "./helpers";
import { LineSide } from "./LineSide";
import { MultiAsGroupedBar } from "./MultiAsGroupedBar";
import type { ChartPairProps } from "./types";

/**
 * Layout 2 columnas:
 *  - Izquierda: (Line | MultiLine | GroupedBar)
 *  - Derecha : DonutSection
 */
export default function ChartPair(props: ChartPairProps) {
  // Si es modo multi con granularidad día, convertir a grouped bar
  const useGroupedBar = shouldUseGroupedBar(props.mode, props.granularity);

  // Determinar el lado izquierdo según el modo
  const leftSide = (() => {
    if (props.mode === "line") {
      return (
        <LineSide series={props.series} granularity={props.granularity} />
      );
    }

    if (props.mode === "multi") {
      if (useGroupedBar) {
        return (
          <MultiAsGroupedBar
            seriesBySub={props.seriesBySub}
            loading={props.loading}
          />
        );
      }
      return (
        <div className="w-full h-full">
          <DrilldownMultiLineSection
            xLabels={props.xLabels}
            seriesBySub={props.seriesBySub}
            loading={props.loading}
            colorsByName={props.colorsByName}
            granularity={props.granularity}
          />
        </div>
      );
    }

    // mode === "grouped"
    return (
      <GroupedBarSide
        categories={props.categories}
        groupedSeries={props.groupedSeries}
        chartTitle={props.chartTitle}
        chartSubtitle={props.chartSubtitle}
        chartHeight={props.chartHeight}
        tooltipFormatter={props.tooltipFormatter}
        yAxisFormatter={props.yAxisFormatter}
        loading={props.loading}
        legendPosition={props.legendPosition}
      />
    );
  })();

  const rightSide = (
    <DonutSide
      donutData={props.donutData}
      onDonutSlice={props.onDonutSlice}
      donutCenterLabel={props.donutCenterLabel}
      actionButtonTarget={props.actionButtonTarget}
      showActivityButton={props.showActivityButton}
    />
  );

  return (
    <ChartPairLayout
      leftSide={leftSide}
      rightSide={rightSide}
      className={props.className}
    />
  );
}
