"use client";

import PieChart from "@/components/charts/PieChart";
import ActivityButton from "@/components/common/ActivityButton";
import type { DonutDatum } from "@/lib/types";
import { BRAND_STOPS, generateBrandGradient } from "@/lib/utils/colors";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import DonutLegendList from "./DonutLegendList";

type DonutSectionProps = {
  donutData: DonutDatum[];
  deltaPct: number;
  onSliceClick?: (label: string) => void;
  centerLabel?: string;
  centerValueOverride?: number;
  actionButtonTarget?: string;
};

type ApexDataPointSelectionCfg = {
  dataPointIndex: number;
  w: { globals: { labels: string[] } };
};

export default function DonutSection({
  donutData,
  onSliceClick,
  centerLabel,
  centerValueOverride,
  actionButtonTarget
}: DonutSectionProps) {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const centerValue = centerValueOverride ?? donutData.length;
  const apexData = useMemo(
    () => donutData.map((d) => ({ label: d.label, value: d.value })),
    [donutData]
  );

  const autoPalette = useMemo(
    () => generateBrandGradient(donutData.length, BRAND_STOPS),
    [donutData.length]
  );
  const paletteForChart = useMemo(
    () =>
      donutData.map((d, i) => d.color ?? autoPalette[i % autoPalette.length]),
    [donutData, autoPalette]
  );
  const colorsByLabel = useMemo(() => {
    const out: Record<string, string> = {};
    donutData.forEach((d, i) => {
      out[d.label] = d.color ?? autoPalette[i % autoPalette.length];
    });
    return out;
  }, [donutData, autoPalette]);

  const handleSelect = (label: string) => {
    setSelectedLabel(label);
    onSliceClick?.(label);
  };

  return (
    <div>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="rounded-xl border bg-white p-3 transition-all duration-200
                   border-gray-200 hover:border-red-300 hover:shadow-md"
      >
        <div className="text-sm font-semibold text-gray-700 mb-2">
          Subcategorías
        </div>
        <div className="flex justify-end pr-2">
          {actionButtonTarget && <ActivityButton target={actionButtonTarget} />}
        </div>
        <PieChart
          data={apexData}
          type="donut"
          height={180}
          palette={paletteForChart}
          colorsByLabel={colorsByLabel}
          showLegend={false}
          dataLabels="none"
          labelPosition="outside"
          optionsExtra={{
            plotOptions: { pie: { donut: { size: "60%" }, offsetY: 10 } },
            chart: {
              events: {
                dataPointSelection: (
                  _evt,
                  _chart,
                  cfg?: ApexDataPointSelectionCfg
                ) => {
                  if (!cfg || typeof cfg.dataPointIndex !== "number") return;
                  const labels = cfg.w?.globals?.labels ?? [];
                  const label = labels[cfg.dataPointIndex];
                  if (label) handleSelect(label);
                },
              },
            },
          }}
          className="w-full"
          centerTop={String(centerValue)}
          centerBottom={centerLabel}
        />
        <DonutLegendList
          items={donutData.map((d, i) => ({
            label: d.label,
            value: d.value,
            color: d.color ?? autoPalette[i % autoPalette.length],
          }))}
          selectedLabel={selectedLabel}
          onSelect={handleSelect}
          columns={2}
          className="mt-4"
        />
      </motion.div>
    </div>
  );
}
