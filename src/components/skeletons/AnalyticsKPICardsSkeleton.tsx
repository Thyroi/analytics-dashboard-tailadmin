"use client";

import React from "react";
import KPICardSkeleton from "./KPICardSkeleton";

type Props = {
  className?: string;
  stretch?: boolean;
};

export default function AnalyticsKPICardsSkeleton({ className = "", stretch = false }: Props) {
  if (!stretch) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 h-full ${className}`}>
      <div className="flex-1">
        <KPICardSkeleton className="h-full" />
      </div>
      <div className="flex-1">
        <KPICardSkeleton className="h-full" />
      </div>
      <div className="flex-1">
        <KPICardSkeleton className="h-full" />
      </div>
    </div>
  );
}
