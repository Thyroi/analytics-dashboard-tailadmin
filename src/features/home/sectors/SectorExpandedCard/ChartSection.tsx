"use client";

import LineChart from "@/components/charts/LineChart";
import { motion } from "motion/react";

type ChartSectionProps = {
  categories: string[];
  currData: number[];
  prevData: number[];
};

export default function ChartSection({
  categories,
  currData,
  prevData,
}: ChartSectionProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="min-h-[420px] h-full flex flex-col rounded-2xl border bg-white shadow-sm pl-6 pr-3 pt-6 pb-6 transition-all duration-200
                 border-gray-200 hover:border-red-300 hover:shadow-md"
    >
      <div className="mb-2" />
      <div className="flex-1 w-full">
        <LineChart
          categories={categories}
          series={[
            { name: "Actual", data: currData },
            { name: "Anterior", data: prevData },
          ]}
          type="area"
          height="100%"
          showLegend={false}
          smooth
          colorsByName={{ Actual: "#dc2626", Anterior: "#e5e7eb" }}
          className="w-full h-full"
        />
      </div>
    </motion.div>
  );
}
