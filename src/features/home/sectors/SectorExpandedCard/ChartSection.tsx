import React from "react";
import LineChart from "@/components/charts/LineChart";

type ChartSectionProps = {
  categories: string[];
  currData: number[];
  prevData: number[];
};

export default function ChartSection({ categories, currData, prevData }: ChartSectionProps) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-[#0b0f14]/70 p-3">
      <div className="w-full h-[320px]">
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
          colorsByName={{ Actual: "#16A34A", Anterior: "#9CA3AF" }}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
