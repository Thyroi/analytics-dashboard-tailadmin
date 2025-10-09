/**
 * Skeleton para panel de drill-down de chatbot
 */

"use client";

import { X } from "lucide-react";
import { motion } from "motion/react";

export type ChatbotDrilldownSkeletonProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
};

export default function ChatbotDrilldownSkeleton({
  isOpen,
  onClose,
  title = "Cargando análisis...",
}: ChatbotDrilldownSkeletonProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-[#0b0f14] rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
          <div>
            <div className="h-8 w-48 rounded bg-gray-200 dark:bg-white/10 animate-pulse mb-2" />
            <div className="h-4 w-64 rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div
          className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]"
          aria-busy="true"
        >
          {/* Summary Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-white/5 rounded-lg p-4"
              >
                <div className="h-8 w-20 rounded bg-gray-200 dark:bg-white/10 animate-pulse mb-2" />
                <div className="h-4 w-24 rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
              </div>
            ))}
          </div>

          {/* Charts Grid Skeleton */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Line Chart Skeleton */}
            <div className="bg-white dark:bg-[#0b0f14] rounded-xl border border-gray-200 dark:border-white/10 p-4">
              <div className="h-6 w-32 rounded bg-gray-200 dark:bg-white/10 animate-pulse mb-4" />

              {/* Chart area */}
              <div className="relative h-[300px] rounded bg-gray-100 dark:bg-white/5">
                {/* Grid lines simulation */}
                <div className="absolute inset-0 flex flex-col justify-between">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-px bg-gray-200/50 dark:bg-white/10"
                    />
                  ))}
                </div>

                {/* Line simulation */}
                <div className="absolute inset-4">
                  <svg className="w-full h-full opacity-30">
                    <polyline
                      fill="none"
                      stroke="#E55338"
                      strokeWidth="2"
                      points="0,80 50,60 100,90 150,45 200,70 250,30"
                      className="animate-pulse"
                    />
                    <polyline
                      fill="none"
                      stroke="#94A3B8"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      points="0,100 50,85 100,110 150,70 200,95 250,60"
                      className="animate-pulse"
                    />
                  </svg>
                </div>

                {/* Loading overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/80 dark:bg-black/50 px-3 py-2 rounded text-sm text-gray-600 dark:text-gray-300">
                    Cargando gráfica...
                  </div>
                </div>
              </div>

              <div className="mt-2 h-3 w-48 rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
            </div>

            {/* Donut Chart Skeleton */}
            <div className="bg-white dark:bg-[#0b0f14] rounded-xl border border-gray-200 dark:border-white/10 p-4">
              <div className="h-6 w-40 rounded bg-gray-200 dark:bg-white/10 animate-pulse mb-4" />

              {/* Donut area */}
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-48 h-48">
                  {/* Donut ring */}
                  <div className="absolute inset-0 rounded-full border-8 border-gray-200 dark:border-white/10" />
                  <div
                    className="absolute inset-0 rounded-full border-8 border-t-red-300 border-r-blue-300 border-b-green-300 border-l-yellow-300 animate-spin"
                    style={{ animationDuration: "3s" }}
                  />

                  {/* Center */}
                  <div className="absolute inset-8 rounded-full bg-white dark:bg-[#0b0f14] flex flex-col items-center justify-center">
                    <div className="h-6 w-12 rounded bg-gray-200 dark:bg-white/10 animate-pulse mb-1" />
                    <div className="h-4 w-16 rounded bg-gray-100 dark:bg-white/5 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Legend skeleton */}
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-2 bg-gray-50 border-gray-200 dark:bg-white/5 dark:border-white/10"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-gray-300 dark:bg-white/20 animate-pulse" />
                      <div className="h-3 w-16 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                    </div>
                    <div className="h-3 w-8 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Info Skeleton */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
            <div className="h-5 w-32 rounded bg-gray-200 dark:bg-white/10 animate-pulse mb-2" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-4 w-full max-w-md rounded bg-gray-100 dark:bg-white/5 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
