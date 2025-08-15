"use client";

import KPICardSkeleton from "@/components/skeletons/KPICardSkeleton";

export default function KPIListSkeleton({
  count = 3,
  className = "",
  stretch = false,
}: {
  count?: number;
  className?: string;
  stretch?: boolean;
}) {
  if (!stretch) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 h-full ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div className="flex-1" key={i}>
          <KPICardSkeleton className="h-full" />
        </div>
      ))}
    </div>
  );
}
