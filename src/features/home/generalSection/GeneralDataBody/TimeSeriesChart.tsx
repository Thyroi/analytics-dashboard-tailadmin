import LineChart from "@/components/charts/LineChart";
import { CURRENT_COLOR, LINE_CHART_PADDING, PREVIOUS_COLOR } from "./constants";

interface TimeSeriesChartProps {
  categories: string[];
  currData: number[];
  prevData: number[];
  currentLabel: string;
  previousLabel: string;
}

export function TimeSeriesChart({
  categories,
  currData,
  prevData,
  currentLabel,
  previousLabel,
}: TimeSeriesChartProps) {
  return (
    <div className={LINE_CHART_PADDING}>
      <div className="w-full h-[300px] md:h-[340px]">
        <LineChart
          categories={categories}
          series={[
            { name: currentLabel, data: currData },
            { name: previousLabel, data: prevData },
          ]}
          type="area"
          height="100%"
          showLegend={false}
          smooth
          colorsByName={{
            [currentLabel]: CURRENT_COLOR,
            [previousLabel]: PREVIOUS_COLOR,
          }}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
