/**
 * Skeleton para tarjetas de chatbot
 */

"use client";

export type ChatbotCardSkeletonProps = {
  count?: number;
  className?: string;
};

export default function ChatbotCardSkeleton({
  count = 6,
  className = "",
}: ChatbotCardSkeletonProps) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}
    >
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div
      className="
        rounded-xl border bg-white p-4 animate-pulse
        border-gray-200 dark:bg-[#0b0f14] dark:border-white/10
      "
      aria-busy="true"
    >
      {/* Header */}
      <div className="mb-3">
        <div className="h-6 w-32 rounded bg-gray-200 dark:bg-white/10 mb-1" />
        <div className="h-3 w-40 rounded bg-gray-100 dark:bg-white/5" />
      </div>

      {/* Métricas principales */}
      <div className="space-y-2">
        {/* Total actual */}
        <div>
          <div className="h-8 w-20 rounded bg-gray-200 dark:bg-white/10 mb-1" />
          <div className="h-4 w-28 rounded bg-gray-100 dark:bg-white/5" />
        </div>

        {/* Delta */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-gray-200 dark:bg-white/10" />
          <div className="h-4 w-12 rounded bg-gray-200 dark:bg-white/10" />
          <div className="h-4 w-16 rounded bg-gray-200 dark:bg-white/10" />
        </div>

        {/* Comparación */}
        <div className="h-3 w-24 rounded bg-gray-100 dark:bg-white/5" />
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/10">
        <div className="h-3 w-20 rounded bg-gray-100 dark:bg-white/5" />
      </div>
    </div>
  );
}
