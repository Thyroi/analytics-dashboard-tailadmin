"use client";

import ActivityButton from "@/components/common/ActivityButton";
import Header from "@/components/common/Header";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { ChartSection } from "./ChartSection";
import { LegendSection } from "./LegendSection";
import type { DonutCardProps } from "./types";
import { useDonutColors } from "./useDonutColors";
import { useDonutData } from "./useDonutData";

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
  emptyLabel = "No se han encontrado datos",
  emptyColor = "#F9FAFB",

  className = "",
}: DonutCardProps) {
  const { theme } = useTheme();
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const interactive = typeof onSliceClick === "function";

  const { isEmpty, centerValue, apexData, autoColumns } = useDonutData(
    items,
    centerValueOverride,
    emptyLabel
  );

  const { paletteBase, colorsByLabel } = useDonutColors(
    items,
    isEmpty,
    theme,
    emptyLabel,
    emptyColor
  );

  const handleSelect = (label: string) => {
    if (!interactive || isEmpty) return;
    setSelectedLabel(label);
    onSliceClick?.(label);
  };

  const wrapperClass =
    variant === "card"
      ? `rounded-xl border bg-white dark:bg-gray-800 p-3 transition-all duration-200 border-gray-200/50 dark:border-gray-700/50 ring-1 ring-black/5 dark:ring-white/10 hover:border-red-300 hover:shadow-md ${
          isEmpty ? "min-h-[420px]" : ""
        } flex flex-col`
      : "p-0 flex flex-col";

  return (
    <div className={className}>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={wrapperClass}
      >
        {!isEmpty && (
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
        )}

        <ChartSection
          apexData={apexData}
          paletteBase={paletteBase}
          colorsByLabel={colorsByLabel}
          interactive={interactive}
          isEmpty={isEmpty}
          centerValue={centerValue}
          centerTitle={centerTitle}
          emptyIcon={emptyIcon}
          handleSelect={handleSelect}
        />

        <LegendSection
          items={items}
          isEmpty={isEmpty}
          colorsByLabel={colorsByLabel}
          interactive={interactive}
          selectedLabel={selectedLabel}
          autoColumns={autoColumns(legendColumns)}
          onSelect={handleSelect}
        />
      </motion.div>
    </div>
  );
}

// Export types for external use
export type { DonutCardItem } from "./types";
