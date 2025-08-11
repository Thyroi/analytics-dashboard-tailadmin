"use client";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { useTheme } from "next-themes";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const CHART_HEIGHT = 260;

export default function DonutChartCard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const options: ApexOptions = {
    chart: {
      type: "donut",
      toolbar: { show: false },
      parentHeightOffset: 0,
      animations: { enabled: true },
    },
    labels: ["Expenses", "Revenue"],
    colors: ["#FF5A5F", "#465FFF"],
    dataLabels: { enabled: false },
    legend: {
      position: "bottom",
      offsetY: 8,
    },
    tooltip: { theme: isDark ? "dark" : "light" },
    plotOptions: {
      pie: {
        donut: { size: "68%" }, // un poco menos para margen interno
        expandOnClick: false,
      },
    },
    // (opcional) evita que el chart intente crecer por responsive
    responsive: [
      {
        breakpoint: 1024,
        options: { plotOptions: { pie: { donut: { size: "64%" } } } },
      },
    ],
  };

  const series = [12400, 21424];

  return (
    <div className="card overflow-hidden">
      <div className="card-header">
        <h3 className="card-title">Expenses vs Revenue</h3>
      </div>
      <div className="card-body">
        {/* wrapper que recorta cualquier desborde */}
        <div
          className="relative w-full overflow-hidden"
          style={{ height: CHART_HEIGHT }}
        >
          <ReactApexChart
            options={options}
            series={series}
            type="donut"
            height={CHART_HEIGHT}
          />
        </div>
      </div>
    </div>
  );
}
