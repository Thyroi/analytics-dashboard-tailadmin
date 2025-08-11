"use client";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import { useTheme } from "next-themes";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function CompareLineChart() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const options: ApexOptions = {
    chart: { type: "line", height: 260, toolbar: { show: false }, animations: { enabled: true }, parentHeightOffset: 0 },
    stroke: { curve: "smooth", width: 3 },
    colors: ["#465FFF", "#FF5A5F"],
    grid: { yaxis: { lines: { show: true } } },
    dataLabels: { enabled: false },
    legend: { position: "top", horizontalAlign: "left" },
    xaxis: { categories: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] },
    tooltip: { theme: isDark ? "dark" : "light" },
  };
  const series = [
    { name: "2016", data: [10,14,12,18,22,19,25,28,26,24,20,18] },
    { name: "2017", data: [8,12,15,16,20,23,22,26,28,29,27,25] },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">Actividad</h3>
          <p className="card-subtitle">Daily • Weekly • Monthly</p>
        </div>
      </div>
      <div className="card-body">
        <ReactApexChart options={options} series={series} type="line" height={260} />
      </div>
    </div>
  );
}
