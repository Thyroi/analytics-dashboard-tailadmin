/**
 * Componente de barras comparativas (Current vs Previous)
 * Para mostrar comparación día por día cuando granularity = 'd'
 * Usa ApexCharts siguiendo la estructura del proyecto
 */

"use client";

import type { SeriesPoint } from "@/lib/types";
import { formatChartLabelsSimple } from "@/lib/utils/charts/labelFormatting";
import { getSeriesLabels } from "@/lib/utils/charts/tooltipLabels";
import { generateBrandGradient } from "@/lib/utils/formatting/colors";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useMemo } from "react";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface ComparisonBarChartProps {
  series: {
    current: SeriesPoint[];
    previous: SeriesPoint[];
  };
  title?: string;
  subtitle?: string;
  height?: number | string;
  showLegend?: boolean;
  tooltipFormatter?: (value: number) => string;
  yAxisFormatter?: (value: number) => string;
  className?: string;
  granularity?: "d" | "w" | "m" | "y";
}

const DEFAULT_HEIGHT = 350;
// Usar la paleta de colores del brand (misma que las donuts)
const COMPARISON_COLORS = generateBrandGradient(2); // Previous y Current usando brand palette

export default function ComparisonBarChart({
  series,
  title = "Comparación de períodos",
  subtitle,
  height = DEFAULT_HEIGHT,
  showLegend = true,
  tooltipFormatter = (value) => value.toLocaleString(),
  yAxisFormatter = (value) => value.toString(),
  className = "",
  granularity = "d",
}: ComparisonBarChartProps) {
  // Preparar categorías (labels del eje X) con formateo según granularidad
  const categories = useMemo(() => {
    const rawLabels = series.current.map((point) => point.label);
    return formatChartLabelsSimple(rawLabels, granularity);
  }, [series, granularity]);

  // Obtener labels dinámicas según granularidad
  const seriesLabels = useMemo(
    () => getSeriesLabels(granularity),
    [granularity]
  );

  // Preparar datos para ApexCharts
  const chartSeries = useMemo(() => {
    return [
      {
        name: seriesLabels.previous,
        data: series.previous.map((point) => point.value),
        color: COMPARISON_COLORS[0],
      },
      {
        name: seriesLabels.current,
        data: series.current.map((point) => point.value),
        color: COMPARISON_COLORS[1],
      },
    ];
  }, [series, seriesLabels]);

  const options: ApexOptions = useMemo(() => {
    return {
      colors: COMPARISON_COLORS,
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
          formatter: (val: number) => yAxisFormatter(val),
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
        position: "top",
        horizontalAlign: "left",
        offsetY: -10,
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
          formatter: (val: number) => tooltipFormatter(val),
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
  }, [categories, height, showLegend, tooltipFormatter, yAxisFormatter]);

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
