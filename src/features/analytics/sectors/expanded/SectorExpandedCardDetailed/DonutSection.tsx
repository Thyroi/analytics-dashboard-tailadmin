"use client";

import PieChart from "@/components/charts/PieChart";
import ActivityButton from "@/components/common/ActivityButton";
import type { DonutDatum } from "@/lib/types";
import { BRAND_STOPS, generateBrandGradient } from "@/lib/utils/colors";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import DonutLegendList from "./DonutLegendList";

type DonutSectionProps = {
  donutData: DonutDatum[];
  onSliceClick?: (label: string) => void;
  centerLabel?: string;
  centerValueOverride?: number;
  actionButtonTarget?: string;
  title?: string;
  /** Puede ser clase Tailwind (“text-red-600”) o un hex (“#c10007”) */
  titleColor?: string;
};

type ApexDataPointSelectionCfg = {
  dataPointIndex: number;
  w: { globals: { labels: string[] } };
};

export default function DonutSection({
  donutData,
  onSliceClick,
  centerLabel,
  centerValueOverride,
  actionButtonTarget,
  title = "Subcategorías",
  titleColor = "text-gray-700",
}: DonutSectionProps) {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const centerValue = centerValueOverride ?? donutData.length;
  const interactive = typeof onSliceClick === "function";

  // Datos para Apex
  const apexData = useMemo(
    () => donutData.map((d) => ({ label: d.label, value: d.value })),
    [donutData]
  );

  // Paleta base (no vacía) usando la gradiente de marca
  const paletteBase = useMemo(() => {
    const p = generateBrandGradient(Math.max(6, donutData.length || 6), BRAND_STOPS);
    return p.length ? p : undefined; // no enviar [] a Apex
  }, [donutData.length]);

  // Colores por label (si el item trae .color se respeta)
  const colorsByLabel = useMemo(() => {
    const out: Record<string, string> = {};
    const fallback = paletteBase ?? [];
    donutData.forEach((d, i) => {
      out[d.label] = d.color ?? fallback[i % Math.max(1, fallback.length)] ?? "#E55338";
    });
    return out;
  }, [donutData, paletteBase]);

  const handleSelect = (label: string) => {
    if (!interactive) return;
    setSelectedLabel(label);
    onSliceClick?.(label);
  };

  // Soporte para color del título: clase o hex
  const titleIsHex = titleColor.startsWith("#");
  const titleClass = titleIsHex ? "text-[inherit]" : titleColor;
  const titleStyle = titleIsHex ? { color: titleColor } : undefined;

  return (
    <div>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="rounded-xl border bg-white p-3 transition-all duration-200
                   border-gray-200 hover:border-red-300 hover:shadow-md"
      >
        <div className={`text-sm font-semibold mb-2 ${titleClass}`} style={titleStyle}>
          {title}
        </div>

        <div className="flex justify-end pr-2">
          {actionButtonTarget && <ActivityButton target={actionButtonTarget} />}
        </div>

        <PieChart
          data={apexData}
          type="donut"
          height={180}
          {...(paletteBase ? { palette: paletteBase } : {})}
          colorsByLabel={colorsByLabel}
          showLegend={false}
          dataLabels="none"
          labelPosition="outside"
          optionsExtra={{
            plotOptions: { pie: { donut: { size: "60%" }, offsetY: 10 } },
            // Solo registramos eventos si es interactivo
            ...(interactive && {
              chart: {
                events: {
                  dataPointSelection: (
                    _evt,
                    _chart,
                    cfg?: ApexDataPointSelectionCfg
                  ) => {
                    if (!cfg || typeof cfg.dataPointIndex !== "number") return;
                    const labels = cfg.w?.globals?.labels ?? [];
                    const label = labels[cfg.dataPointIndex];
                    if (label) handleSelect(label);
                  },
                },
              },
            }),
          }}
          className="w-full"
          centerTop={String(centerValue)}
          centerBottom={centerLabel}
        />

        <DonutLegendList
          items={donutData.map((d) => ({
            label: d.label,
            value: d.value,
            color: colorsByLabel[d.label],
          }))}
          {...(interactive
            ? { selectedLabel, onSelect: handleSelect, columns: 2 as const }
            : { columns: 1 as const })}
          className="mt-4"
        />
      </motion.div>
    </div>
  );
}
