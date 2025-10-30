import PieChart from "@/components/charts/PieChart";
import type { LucideIcon } from "lucide-react";
import { EmptyState } from "./EmptyState";
import type { ApexDataPointSelectionCfg } from "./types";

type ChartSectionProps = {
  apexData: Array<{ label: string; value: number }>;
  paletteBase?: string[];
  colorsByLabel: Record<string, string>;
  interactive: boolean;
  isEmpty: boolean;
  centerValue: number;
  centerTitle?: string;
  emptyIcon?: LucideIcon;
  handleSelect: (label: string) => void;
};

export function ChartSection({
  apexData,
  paletteBase,
  colorsByLabel,
  interactive,
  isEmpty,
  centerValue,
  centerTitle,
  emptyIcon,
  handleSelect,
}: ChartSectionProps) {
  return (
    <div
      className={`relative w-full flex-1 flex ${
        isEmpty ? "items-center justify-center" : "flex-col"
      }`}
    >
      <PieChart
        data={apexData}
        type="donut"
        height={320}
        {...(paletteBase ? { palette: paletteBase } : {})}
        colorsByLabel={colorsByLabel}
        showLegend={false}
        dataLabels="none"
        labelPosition="outside"
        optionsExtra={{
          plotOptions: {
            pie: { donut: { size: "60%" }, offsetY: 10 },
          },
          ...(interactive &&
            !isEmpty && {
              chart: {
                events: {
                  dataPointSelection: (
                    _evt: unknown,
                    _chart: unknown,
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
        className="w-full flex-1"
        // En vacío no mostramos número en el centro; en normal sí
        centerTop={isEmpty ? "" : String(centerValue)}
        centerBottom={isEmpty ? "" : centerTitle}
      />

      {isEmpty && <EmptyState emptyIcon={emptyIcon} />}
    </div>
  );
}
