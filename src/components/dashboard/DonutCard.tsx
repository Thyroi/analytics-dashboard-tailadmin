"use client";

import PieChart from "@/components/charts/PieChart";
import ActivityButton from "@/components/common/ActivityButton";
import Header from "@/components/common/Header";
import LegendList, { type LegendItem } from "@/components/dashboard/LegendList";
import {
  BRAND_STOPS,
  generateBrandGradient,
} from "@/lib/utils/formatting/colors";
import type { LucideIcon } from "lucide-react";
import { CircleSlash } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";

export type DonutCardItem = {
  label: string;
  value: number;
  color?: string;
};

type ApexDataPointSelectionCfg = {
  dataPointIndex: number;
  w: { globals: { labels: string[] } };
};

export type DonutCardProps = {
  items: DonutCardItem[];
  onSliceClick?: (label: string) => void;

  /** Encabezado (usa <Header/>) */
  title: string;
  subtitle?: string;
  Icon?: LucideIcon;
  iconColor?: string;
  titleSize?: "xxs" | "xs" | "s" | "sm" | "md" | "lg";
  titleClassName?: string;
  subtitleColor?: string;

  /** Texto inferior del centro del donut (ej. "Total") */
  centerTitle?: string;
  /** Si lo pasas, usa este valor en el centro; si no, suma de `items` */
  centerValueOverride?: number;

  /** Link/target del botón de acción (opcional) */
  actionHref?: string;

  /** Altura del gráfico */
  height?: number;

  /** Columnas de la leyenda en modo interactivo/estático */
  legendColumns?: 1 | 2;

  /** Apariencia del contenedor interno */
  variant?: "card" | "plain";

  /** Estado vacío (muestra donut 100% + ícono centrado) */
  emptyIcon?: LucideIcon;
  emptyLabel?: string;
  emptyColor?: string;

  className?: string;
};

export default function DonutCard({
  items,
  onSliceClick,

  title,
  subtitle,
  Icon,
  iconColor,
  titleSize = "sm",
  titleClassName,
  subtitleColor,

  centerTitle,
  centerValueOverride,
  actionHref,
  legendColumns,
  variant = "card",

  emptyIcon,
  emptyLabel = "Sin datos",
  emptyColor = "#E5E7EB",

  className = "",
}: DonutCardProps) {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const interactive = typeof onSliceClick === "function";

  const sum = useMemo(
    () =>
      items.reduce(
        (acc, it) => acc + (Number.isFinite(it.value) ? it.value : 0),
        0
      ),
    [items]
  );
  const isEmpty = items.length === 0 || sum <= 0;

  // Calcular columnas automáticamente si no se especifica
  const autoColumns = useMemo(() => {
    if (legendColumns !== undefined) return legendColumns;
    // Si hay más de 5 items, usar 2 columnas; si no, 1 columna
    return items.length > 5 ? 2 : 1;
  }, [legendColumns, items.length]);

  const centerValue = useMemo(() => {
    if (isEmpty) return 0;
    if (typeof centerValueOverride === "number") return centerValueOverride;
    return sum;
  }, [isEmpty, sum, centerValueOverride]);

  // Datos para Apex (si está vacío, un único slice al 100%)
  const apexData = useMemo(() => {
    if (isEmpty) return [{ label: emptyLabel, value: 1 }];
    return items.map((d) => ({ label: d.label, value: d.value }));
  }, [isEmpty, items, emptyLabel]);

  // Paleta base (mínimo 6)
  const paletteBase = useMemo(() => {
    if (isEmpty) return undefined; // color fijo gris para el vacío
    const count = Math.max(6, items.length || 6);
    const p = generateBrandGradient(count, BRAND_STOPS);
    return p.length ? p : undefined;
  }, [items.length, isEmpty]);

  // Colores por label (respeta color si viene; en vacío usa gris)
  const colorsByLabel = useMemo(() => {
    if (isEmpty) return { [emptyLabel]: emptyColor };
    const out: Record<string, string> = {};
    const fb = paletteBase ?? [];
    items.forEach((d, i) => {
      out[d.label] = d.color ?? fb[i % Math.max(1, fb.length)] ?? "#E55338";
    });
    return out;
  }, [isEmpty, items, paletteBase, emptyLabel, emptyColor]);

  const legendItems: LegendItem[] = useMemo(() => {
    if (isEmpty) return [];
    return items.map((d) => ({
      label: d.label,
      value: d.value,
      color: colorsByLabel[d.label],
    }));
  }, [isEmpty, items, colorsByLabel]);

  const handleSelect = (label: string) => {
    if (!interactive || isEmpty) return;
    setSelectedLabel(label);
    onSliceClick?.(label);
  };

  const wrapperClass =
    variant === "card"
      ? "rounded-xl border bg-white p-3 transition-all duration-200 border-gray-200 hover:border-red-300 hover:shadow-md h-full flex flex-col"
      : "p-0 h-full flex flex-col";

  const EmptyIcon = emptyIcon ?? CircleSlash;

  return (
    <div className={className}>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={wrapperClass}
      >
        <div className="flex items-start justify-between">
          <Header
            className="m-0 p-0"
            title={title}
            subtitle={subtitle}
            Icon={Icon}
            iconColor={iconColor}
            titleSize={titleSize}
            titleClassName={titleClassName}
            subtitleColor={subtitleColor}
          />
          {actionHref && <ActivityButton target={actionHref} />}
        </div>

        <div className="relative w-full flex-1 flex flex-col">
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
                        if (!cfg || typeof cfg.dataPointIndex !== "number")
                          return;
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

          {isEmpty && (
            <EmptyIcon
              className="pointer-events-none absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
          )}
        </div>

        {!isEmpty && (
          <LegendList
            items={legendItems}
            {...(interactive
              ? {
                  selectedLabel,
                  onSelect: handleSelect,
                  columns: autoColumns,
                }
              : { columns: autoColumns })}
            className="mt-4"
          />
        )}
      </motion.div>
    </div>
  );
}
