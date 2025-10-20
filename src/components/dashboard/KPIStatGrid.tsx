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
  autoSlide?: boolean;
  slideInterval?: number;
};

export default function KPIStatGrid({
  items,
  className = "",
  colsClassName = "",
  minItemWidth = 221,
  infiniteRow = false,
  itemsPerPage = 4,
  autoSlide = false,
  slideInterval = 4000,
}: Props) {
  const [page, setPage] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  const pages = infiniteRow
    ? Math.max(1, Math.ceil(items.length / itemsPerPage))
    : 1;
  const sliceStart = infiniteRow ? page * itemsPerPage : 0;
  const slice = infiniteRow
    ? items.slice(sliceStart, sliceStart + itemsPerPage)
    : items;

  const next = () => setPage((p) => (p + 1) % pages); // Circular navigation
  const prev = () => setPage((p) => (p - 1 + pages) % pages); // Circular navigation

  // Auto-slide functionality
  React.useEffect(() => {
    if (!autoSlide || !infiniteRow || pages <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setPage((p) => (p + 1) % pages);
    }, slideInterval);

    return () => clearInterval(interval);
  }, [autoSlide, infiniteRow, pages, isHovered, slideInterval]);

  return (
    <div
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`grid items-stretch gap-6 ${colsClassName}`}
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
      </div>
      {infiniteRow && items.length > itemsPerPage && (
        <div className="flex justify-center mt-3">
          <PagerDots
            page={page}
            pages={pages}
            onPrev={prev}
            onNext={next}
            className={
              autoSlide ? "opacity-75 hover:opacity-100 transition-opacity" : ""
            }
          />
        </div>
      )}
    </div>
  );
}
