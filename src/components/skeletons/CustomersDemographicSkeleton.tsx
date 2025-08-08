// src/components/skeletons/CustomersDemographicSkeleton.tsx
"use client";

import MapSkeleton from "./MapSkeleton";
import CountryRowSkeleton from "./CountryRowSkeleton";

type Props = {
  height?: number;
  rows?: number;
  wrapInCard?: boolean; // default true
  showHeader?: boolean; // default true
};

export default function CustomersDemographicSkeleton({
  height = 260,
  rows = 6,
  wrapInCard = true,
  showHeader = true,
}: Props) {
  const Header = showHeader ? (
    <div className="card-header">
      <div>
        <div className="skeleton h-5 w-48 rounded-md" />
        <div className="skeleton mt-2 h-4 w-64 rounded-md" />
      </div>
      <div className="skeleton h-11 w-64 rounded-lg" />
    </div>
  ) : null;

  const Body = (
    <div className="card-body">
      <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50/60 p-2 dark:border-gray-800 dark:bg-white/[0.05]">
        <div className="rounded-xl bg-white p-2 dark:bg-white/5">
          <MapSkeleton height={height} />
        </div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <CountryRowSkeleton
            key={i}
            nameWidth={150 + (i % 3) * 20}
            subWidth={90 + (i % 4) * 10}
            barWidth={`${50 + (i % 5) * 8}%`}
          />
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <div className="skeleton h-3 w-40 rounded-md" />
      </div>
    </div>
  );

  if (!wrapInCard) {
    return (
      <>
        {Header}
        {Body}
      </>
    );
  }

  return (
    <div className="card">
      {Header}
      {Body}
    </div>
  );
}

