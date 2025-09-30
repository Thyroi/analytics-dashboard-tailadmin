"use client";

import * as React from "react";
import KPIStatCard, { type Props as KPIStatCardProps } from "./KPIStatCard";

type Props = {
  items: KPIStatCardProps[];
  className?: string;
  colsClassName?: string;
  minItemWidth?: number;
};

export default function KPIStatGrid({
  items,
  className = "",
  colsClassName = "",
  minItemWidth = 221,
}: Props) {
  return (
    <div
      className={`grid items-stretch gap-6 ${colsClassName} ${className}`}
      /** ⬇️ clave: tantas columnas como quepan, cada item con mínimo 221px */
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))` }}
    >
      {items.map((it, i) => (
        <KPIStatCard key={`${it.title}-${i}`} {...it} delay={it.delay ?? i * 0.1} />
      ))}
    </div>
  );
}
