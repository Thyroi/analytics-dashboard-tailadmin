import type { ApexOptions } from "apexcharts";
import { useMemo } from "react";

export function useChartOptions(
  type: "line" | "area",
  categories: string[],
  colors: string[],
  dashArray: number[],
  strokeWidths: number[],
  smooth: boolean,
  fill: ApexOptions["fill"],
  showLegend: boolean,
  legendPosition: "bottom" | "top" | "right" | "left",
  isDark: boolean,
  optionsExtra: ApexOptions | undefined
) {
  const axisLabelColor = isDark ? "#9CA3AF" : "#6B7280";
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const foreColor = isDark ? "#E5E7EB" : "#374151";

  return useMemo(() => {
    // Config de leyenda: si está desactivada, no se reserva alto
    const legendOpts: ApexOptions["legend"] = showLegend
      ? { show: true, position: legendPosition, labels: { colors: foreColor } }
      : { show: false, height: 0, offsetY: 0 };

    const base: ApexOptions = {
      chart: {
        fontFamily: "Outfit, sans-serif",
        type,
        height: "100%",
        background: "transparent",
        toolbar: { show: false },
        redrawOnParentResize: true,
        parentHeightOffset: 0,
        foreColor,
        offsetX: 0,
        offsetY: 0,
        sparkline: { enabled: false },
        events: {},
        zoom: {
          enabled: false,
          type: "x",
          autoScaleYaxis: false,
        },
      },
      stroke: {
        curve: smooth ? "smooth" : "straight",
        width: strokeWidths,
        dashArray,
      },
      markers: {
        size: 0,
        hover: { sizeOffset: 3 },
        strokeWidth: 0,
        strokeOpacity: 0.9,
        fillOpacity: 1,
      },
      fill,
      grid: {
        borderColor: gridColor,
        yaxis: { lines: { show: true } },
        xaxis: { lines: { show: false } },
        padding: {
          left: 0,
          right: 20,
          top: 0,
          bottom: 0,
        },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories,
        tickPlacement: "on",
        labels: {
          style: { fontSize: "12px", colors: axisLabelColor },
          rotate: 0,
          trim: false,
          hideOverlappingLabels: false,
          offsetX: 0,
          offsetY: 0,
        },
        axisBorder: { show: true, color: gridColor },
        axisTicks: { show: true, color: gridColor },
        min: undefined,
        max: undefined,
      },
      yaxis: {
        labels: { style: { fontSize: "12px", colors: axisLabelColor } },
        decimalsInFloat: 0,
      },
      tooltip: {
        enabled: true,
        shared: true,
        theme: isDark ? "dark" : "light",
        followCursor: false,
        intersect: false,
      },
      legend: legendOpts,
      colors,
    };

    // Merge opcional del consumidor
    const merged = { ...base, ...(optionsExtra ?? {}) };

    // Proteger las categories
    if (merged.xaxis && categories?.length > 0) {
      merged.xaxis.categories = categories;
    }

    // Asegurar que no se reserve espacio para leyenda desactivada
    if (!showLegend) merged.legend = legendOpts;

    return merged;
  }, [
    axisLabelColor,
    categories,
    colors,
    dashArray,
    foreColor,
    gridColor,
    isDark,
    legendPosition,
    optionsExtra,
    showLegend,
    smooth,
    strokeWidths,
    type,
    fill,
  ]);
}
