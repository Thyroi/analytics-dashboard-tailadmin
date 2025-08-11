"use client";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { useTheme } from "next-themes";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function DonutChartCard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const options: ApexOptions = {
    chart: { type: "donut", height: 260, toolbar: { show: false }, parentHeightOffset: 0 },
    labels: ["Expenses", "Revenue"],
    colors: ["#FF5A5F", "#465FFF"],
    legend: { position: "bottom" },
    dataLabels: { enabled: false },
    tooltip: { theme: isDark ? "dark" : "light" },
    plotOptions: { pie: { donut: { size: "70%" } } },
  };
  const series = [12400, 21424];

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Expenses vs Revenue</h3>
      </div>
      <div className="card-body">
        <ReactApexChart options={options} series={series} type="donut" height={260} />
      </div>
    </div>
  );
}
