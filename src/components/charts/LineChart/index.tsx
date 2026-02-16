"use client";

import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_PALETTE } from "./constants";
import type { LineChartProps } from "./types";
import { useChartOptions } from "./useChartOptions";
import { useFillConfig } from "./useFillConfig";
import { useLineChartStyles } from "./useLineChartStyles";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function LineChart({
  categories,
  series,
  type = "line",
  height = "100%",
  palette = DEFAULT_PALETTE,
  colorsByName,
  showLegend = true,
  legendPosition = "bottom",
  smooth = false,
  optionsExtra,
  className = "",
  brandAreaGradient = false,
}: LineChartProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  const { colors, dashArray, strokeWidths } = useLineChartStyles(
    series,
    colorsByName,
    palette,
  );

  const fill = useFillConfig(type, brandAreaGradient);

  const options = useChartOptions(
    type,
    categories,
    colors,
    dashArray,
    strokeWidths,
    smooth,
    fill,
    showLegend,
    legendPosition,
    isDark,
    optionsExtra,
  );

  const key = useMemo(
    () =>
      `${type}-${smooth ? "smooth" : "straight"}-${isDark ? "dark" : "light"}|${
        categories.length
      }|${series.map((s) => s.name).join(",")}`,
    [type, smooth, isDark, categories.length, series],
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateHeight = () => {
      const nextHeight = Math.round(element.clientHeight);
      if (nextHeight > 0) {
        setContainerHeight((prev) => (prev !== nextHeight ? nextHeight : prev));
      }
    };

    updateHeight();

    const observer = new ResizeObserver(() => {
      updateHeight();
    });
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  const resolvedChartHeight = useMemo(() => {
    if (typeof height === "number") return height;

    if (typeof height === "string") {
      const pxMatch = height.match(/^(\d+)px$/);
      if (pxMatch) {
        return Number(pxMatch[1]);
      }
    }

    return containerHeight > 0 ? containerHeight : 320;
  }, [height, containerHeight]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full overflow-hidden ${className}`}
      style={{ height }}
    >
      <ReactApexChart
        key={key}
        options={options}
        series={series}
        type={type}
        height={resolvedChartHeight}
        width="100%"
      />
    </div>
  );
}

// Export types for external use
export type { LineSeries } from "./types";
