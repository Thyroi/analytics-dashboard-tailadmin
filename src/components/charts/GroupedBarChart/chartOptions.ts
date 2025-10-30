import type { ApexOptions } from "apexcharts";
import { useMemo } from "react";

type ChartOptionsParams = {
  categories: string[];
  colors: string[];
  height: number | string;
  showLegend: boolean;
  legendPosition: "top" | "bottom";
  tooltipFormatter?: (val: number) => string;
  yAxisFormatter?: (val: number) => string;
  optionsExtra?: ApexOptions;
};

export function useChartOptions({
  categories,
  colors,
  height,
  showLegend,
  legendPosition,
  tooltipFormatter,
  yAxisFormatter,
  optionsExtra,
}: ChartOptionsParams): ApexOptions {
  return useMemo(() => {
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
        offsetY: legendPosition === "bottom" ? 10 : -10,
        offsetX: 0,
        fontSize: "12px",
        fontWeight: 500,
        markers: {
          size: 8,
          offsetY: 0,
        },
        itemMargin: {
          horizontal: 16,
          vertical: 8,
        },
        floating: false,
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
}
