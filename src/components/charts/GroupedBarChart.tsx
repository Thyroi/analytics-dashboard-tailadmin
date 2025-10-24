"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useMemo } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export type GroupedBarSeries = {
  name: string;
  data: number[];
  color?: string; // Color específico para esta serie
};

type Props = {
  /** Etiquetas del eje X (ej: meses, categorías, etc.) */
  categories: string[];
  /** Series de datos para comparar */
  series: GroupedBarSeries[];
  /** Alto del gráfico */
  height?: number | string;
  /** Clases CSS adicionales */
  className?: string;
  /** Título opcional */
  title?: string;
  /** Subtítulo opcional (ej: "Total number of deliveries 70.5K") */
  subtitle?: string;
  /** Mostrar leyenda */
  showLegend?: boolean;
  /** Posición de la leyenda (top | bottom) */
  legendPosition?: "top" | "bottom";
  /** Colores por defecto si no se especifican en series */
  defaultColors?: string[];
  /** Formato personalizado para tooltips */
  tooltipFormatter?: (val: number) => string;
  /** Formato para labels del eje Y */
  yAxisFormatter?: (val: number) => string;
  /** Opciones adicionales de ApexCharts */
  optionsExtra?: ApexOptions;
};

const DEFAULT_HEIGHT = 350;
const DEFAULT_COLORS = [
  "#A8C5DA", // Azul claro (Shipment)
  "#3B82F6", // Azul fuerte (Delivery)
  "#10B981", // Verde
  "#F59E0B", // Amarillo
  "#EF4444", // Rojo
  "#8B5CF6", // Púrpura
];

export default function GroupedBarChart({
  categories,
  series,
  height = DEFAULT_HEIGHT,
  className = "",
  title,
  subtitle,
  showLegend = true,
  legendPosition = "top",
  defaultColors = DEFAULT_COLORS,
  tooltipFormatter,
  yAxisFormatter,
  optionsExtra,
}: Props) {
  const chartSeries = useMemo(() => {
    return series.map((s, index) => ({
      name: s.name,
      data: s.data,
      color: s.color || defaultColors[index % defaultColors.length],
    }));
  }, [series, defaultColors]);

  const colors = useMemo(() => {
    return chartSeries.map((s) => s.color);
  }, [chartSeries]);

  const options: ApexOptions = useMemo(() => {
    const base: ApexOptions = {
      colors,
      chart: {
        fontFamily: "Outfit, sans-serif",
        type: "bar",
        height,
        width: "100%",
        toolbar: { show: false },
        redrawOnParentResize: true,
        parentHeightOffset: 0,
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "65%",
          borderRadius: 4,
          borderRadiusApplication: "end",
          dataLabels: {
            position: "top",
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 2,
        colors: ["transparent"],
      },
      xaxis: {
        categories,
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        labels: {
          style: {
            fontSize: "12px",
            fontWeight: 500,
            colors: "#64748B",
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            fontSize: "12px",
            fontWeight: 400,
            colors: "#64748B",
          },
          formatter: yAxisFormatter || ((val: number) => `${Math.round(val)}%`),
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      grid: {
        borderColor: "#E2E8F0",
        strokeDashArray: 3,
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
        padding: {
          top: 0,
          right: 20,
          bottom: 0,
          left: 20,
        },
      },
      legend: {
        show: showLegend,
        position: legendPosition,
        horizontalAlign: legendPosition === "bottom" ? "center" : "left",
        offsetY: legendPosition === "bottom" ? 8 : -10,
        fontSize: "12px",
        fontWeight: 500,
        markers: {
          size: 8,
          offsetY: 0,
        },
        itemMargin: {
          horizontal: 16,
          vertical: 4,
        },
      },
      tooltip: {
        shared: true,
        intersect: false,
        style: {
          fontSize: "12px",
          fontFamily: "Outfit, sans-serif",
        },
        y: {
          formatter: tooltipFormatter || ((val: number) => `${val}%`),
        },
      },
      fill: {
        opacity: 0.9,
      },
      states: {
        hover: {
          filter: {
            type: "lighten",
          },
        },
      },
      responsive: [
        {
          breakpoint: 768,
          options: {
            plotOptions: {
              bar: {
                columnWidth: "75%",
              },
            },
            grid: {
              padding: {
                left: 10,
                right: 10,
              },
            },
          },
        },
        {
          breakpoint: 480,
          options: {
            plotOptions: {
              bar: {
                columnWidth: "85%",
              },
            },
            xaxis: {
              labels: {
                style: {
                  fontSize: "10px",
                },
              },
            },
            yaxis: {
              labels: {
                style: {
                  fontSize: "10px",
                },
              },
            },
          },
        },
      ],
    };

    return { ...base, ...(optionsExtra ?? {}) };
  }, [
    categories,
    colors,
    height,
    showLegend,
    legendPosition,
    tooltipFormatter,
    yAxisFormatter,
    optionsExtra,
  ]);

  return (
    <div className={`w-full bg-white dark:bg-gray-800 rounded-lg ${className}`}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="p-6 pb-2">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="px-6 pb-6">
        <div style={{ height }}>
          <ReactApexChart
            options={options}
            series={chartSeries}
            type="bar"
            height={height}
          />
        </div>
      </div>
    </div>
  );
}

// Componente de ejemplo/demo
export function GroupedBarChartDemo() {
  const demoData = {
    categories: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    series: [
      {
        name: "Shipment",
        data: [80, 60, 70, 40, 70, 45, 45, 55, 58, 50, 65, 75],
        color: "#A8C5DA", // Azul claro
      },
      {
        name: "Delivery",
        data: [87, 47, 65, 23, 75, 67, 73, 85, 25, 70, 85, 90],
        color: "#3B82F6", // Azul fuerte
      },
    ],
  };

  return (
    <GroupedBarChart
      title="Delivery Statistics"
      subtitle="Total number of deliveries 70.5K"
      categories={demoData.categories}
      series={demoData.series}
      height={320}
      showLegend={true}
      tooltipFormatter={(val) => `${val}%`}
      yAxisFormatter={(val) => `${val}%`}
    />
  );
}
