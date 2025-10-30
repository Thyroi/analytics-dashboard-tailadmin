import GroupedBarChart from "@/components/charts/GroupedBarChart";
import { CURRENT_COLOR, PADDING_CLASSES, PREVIOUS_COLOR } from "./constants";

interface DailyChartProps {
  categories: string[];
  currData: number[];
  prevData: number[];
  currentLabel: string;
  previousLabel: string;
}

export function DailyChart({
  categories,
  currData,
  prevData,
  currentLabel,
  previousLabel,
}: DailyChartProps) {
  return (
    <div className={PADDING_CLASSES}>
      <GroupedBarChart
        categories={categories}
        series={[
          { name: previousLabel, data: prevData, color: PREVIOUS_COLOR },
          { name: currentLabel, data: currData, color: CURRENT_COLOR },
        ]}
        height={300}
        showLegend={true}
        legendPosition="top"
        tooltipFormatter={(val) => val.toLocaleString("es-ES")}
        yAxisFormatter={(val) => `${Math.round(val)}`}
        optionsExtra={{
          states: {
            hover: {
              filter: {
                type: "none", // Desactivar efecto de hover
              },
            },
            active: {
              filter: {
                type: "none", // Desactivar efecto de active
              },
            },
          },
        }}
        className="w-full"
      />
    </div>
  );
}
