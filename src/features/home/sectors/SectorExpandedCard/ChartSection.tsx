"use client";

import LineChart from "@/components/charts/LineChart";
import type { Granularity } from "@/lib/types";
import { getSeriesLabels } from "@/lib/utils/charts/tooltipLabels";
import { motion } from "motion/react";
import { useMemo } from "react";

type ChartSectionProps = {
  categories: string[];
  currData: number[];
  prevData: number[];
  granularity?: Granularity;
};

export default function ChartSection({
  categories,
  currData,
  prevData,
  granularity = "d",
}: ChartSectionProps) {
  // Obtener labels dinámicas según granularidad
  const labels = useMemo(() => getSeriesLabels(granularity), [granularity]);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="min-h-[420px] h-full flex flex-col rounded-2xl border bg-white dark:bg-gray-800 shadow-sm pl-6 pr-3 pt-6 pb-6 transition-all duration-200
                 border-gray-200/50 dark:border-gray-700/50 ring-1 ring-black/5 dark:ring-white/10 hover:border-red-300 hover:shadow-md"
    >
      <div className="mb-2" />
      <div className="flex-1 w-full min-h-0">
        <LineChart
          categories={categories}
          series={[
            { name: labels.current, data: currData },
            { name: labels.previous, data: prevData },
          ]}
          type="area"
          height="100%"
          showLegend={false}
          smooth
          colorsByName={{
            [labels.current]: "#dc2626",
            [labels.previous]: "#e5e7eb",
          }}
          className="w-full h-full"
        />
      </div>
    </motion.div>
  );
}
