"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export default function PagerDots({
  page, pages, onPrev, onNext, className = "",
}: { page: number; pages: number; onPrev: () => void; onNext: () => void; className?: string }) {
  return (
    <div className={`mt-4 flex items-center justify-center gap-3 ${className}`}>
      <button onClick={onPrev} disabled={page === 0}
        className="p-2 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40"
        aria-label="Página anterior">
        <ChevronLeftIcon className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-1.5" aria-live="polite">
        {Array.from({ length: pages }).map((_, i) => (
          <span key={i} className={`h-2.5 w-2.5 rounded-full ${i === page ? "bg-gray-900 dark:bg-white" : "bg-gray-300 dark:bg-white/30"}`} />
        ))}
      </div>
      <button onClick={onNext} disabled={page >= pages - 1}
        className="p-2 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40"
        aria-label="Página siguiente">
        <ChevronRightIcon className="h-5 w-5" />
      </button>
    </div>
  );
}
