import LineChart from "@/components/charts/LineChart";

interface ChartContentProps {
  height: number | string;
  categories: string[];
  series: Array<{ name: string; data: number[] }>;
  smooth: boolean;
  colorsByName?: Record<string, string>;
  hasData: boolean;
}

export function ChartContent({
  height,
  categories,
  series,
  smooth,
  colorsByName,
  hasData,
}: ChartContentProps) {
  return (
    <div
      className="w-full"
      style={{
        height: typeof height === "number" ? `${height}px` : height,
      }}
    >
      <LineChart
        categories={categories}
        series={series}
        type="line"
        height="100%"
        showLegend={true}
        smooth={smooth}
        colorsByName={colorsByName}
        className="w-full h-full"
      />
      {!hasData && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          No hay valores distintos de 0 en el rango seleccionado.
        </div>
      )}
    </div>
  );
}
