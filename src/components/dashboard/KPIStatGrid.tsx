"use client";

import PagerDots from "@/components/common/PagerDots";
import * as React from "react";
import KPIStatCard, { type Props as KPIStatCardProps } from "./KPIStatCard";

type Props = {
  items: KPIStatCardProps[];
  className?: string;
  colsClassName?: string;
  minItemWidth?: number;
  infiniteRow?: boolean;
  itemsPerPage?: number;
};

export default function KPIStatGrid({
  items,
  className = "",
  colsClassName = "",
  minItemWidth = 221,
  infiniteRow = false,
  itemsPerPage = 4,
}: Props) {
  const [page, setPage] = React.useState(0);
  const pages = infiniteRow
    ? Math.max(1, Math.ceil(items.length / itemsPerPage))
    : 1;
  const sliceStart = infiniteRow ? page * itemsPerPage : 0;
  const slice = infiniteRow
    ? items.slice(sliceStart, sliceStart + itemsPerPage)
    : items;

  const next = () => setPage((p) => Math.min(pages - 1, p + 1));
  const prev = () => setPage((p) => Math.max(0, p - 1));

  return (
    <div
      className={`grid items-stretch gap-6 ${colsClassName} ${className}`}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`,
      }}
    >
      {slice.map((it, i) => (
        <KPIStatCard
          key={`${it.title}-${i + sliceStart}`}
          {...it}
          delay={it.delay ?? (i + sliceStart) * 0.1}
        />
      ))}
      {infiniteRow && items.length > itemsPerPage && (
        <PagerDots
          className="mt-3"
          page={page}
          pages={pages}
          onPrev={prev}
          onNext={next}
        />
      )}
    </div>
  );
}
