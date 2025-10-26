"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

type Props = {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  rawData: unknown;
  processedData: {
    currentTotal: number;
    prevTotal: number;
    deltaAbs: number;
    deltaPct: number | null;
    artifactState: string;
  };
};

export default function DebugModal({
  title,
  isOpen,
  onClose,
  rawData,
  processedData,
}: Props) {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="
          bg-white dark:bg-gray-800
          rounded-lg shadow-2xl
          w-full max-w-6xl max-h-[90vh]
          overflow-hidden
          flex flex-col
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="
              p-2 rounded-lg
              hover:bg-gray-100 dark:hover:bg-gray-700
              transition-colors
            "
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Raw Data Column */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                📦 Raw Data (Backend Response)
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {JSON.stringify(rawData, null, 2)}
                </pre>
              </div>
            </div>

            {/* Processed Data Column */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                ⚙️ Processed Data (Used for Calculation)
              </h3>
              <div className="space-y-4">
                {/* Current Total */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Current Total
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {processedData.currentTotal}
                  </div>
                </div>

                {/* Previous Total */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Previous Total
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {processedData.prevTotal}
                  </div>
                </div>

                {/* Delta Absolute */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Delta Absolute
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {processedData.deltaAbs > 0 ? "+" : ""}
                    {processedData.deltaAbs}
                  </div>
                </div>

                {/* Delta Percent */}
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Delta Percent
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {processedData.deltaPct !== null
                      ? `${
                          processedData.deltaPct > 0 ? "+" : ""
                        }${processedData.deltaPct.toFixed(1)}%`
                      : "null"}
                  </div>
                </div>

                {/* Artifact State */}
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Artifact State
                  </div>
                  <div className="text-lg font-mono text-gray-900 dark:text-white">
                    {processedData.artifactState}
                  </div>
                </div>

                {/* Calculation Formula */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Calculation Formula
                  </div>
                  <code className="text-xs font-mono text-gray-800 dark:text-gray-200 block">
                    {processedData.prevTotal > 0
                      ? `((${processedData.currentTotal} - ${
                          processedData.prevTotal
                        }) / ${
                          processedData.prevTotal
                        }) × 100 = ${processedData.deltaPct?.toFixed(1)}%`
                      : "prev ≤ 0 → deltaPct = null"}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="
              px-4 py-2
              bg-gray-200 dark:bg-gray-700
              hover:bg-gray-300 dark:hover:bg-gray-600
              text-gray-900 dark:text-white
              rounded-lg font-medium
              transition-colors
            "
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
