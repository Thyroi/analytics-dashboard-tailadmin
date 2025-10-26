"use client";

import type { DeltaArtifact } from "@/lib/utils/delta";
import { getDeltaColor, getDeltaMainText } from "@/lib/utils/delta";
import Image from "next/image";

type Props = {
  id: string;
  label: string;
  iconSrc: string;
  currentValue: number;
  previousValue: number;
  deltaArtifact: DeltaArtifact;
  onClick: () => void;
};

export default function DebugCategoryCard({
  label,
  iconSrc,
  currentValue,
  previousValue,
  deltaArtifact,
  onClick,
}: Props) {
  const deltaText = getDeltaMainText(deltaArtifact);
  const deltaColor = getDeltaColor(deltaArtifact);

  return (
    <button
      onClick={onClick}
      className="
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        rounded-lg p-4
        hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-400
        transition-all cursor-pointer
        text-left
      "
    >
      {/* Icon + Label */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative w-12 h-12 flex-shrink-0">
          <Image src={iconSrc} alt={label} fill className="object-contain" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
          {label}
        </h3>
      </div>

      {/* Values */}
      <div className="space-y-2 mb-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Current:
          </span>
          <span className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
            {currentValue}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Previous:
          </span>
          <span className="text-sm font-mono font-semibold text-gray-700 dark:text-gray-300">
            {previousValue}
          </span>
        </div>
      </div>

      {/* Delta */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Delta:
          </span>
          <span className={`text-lg font-bold ${deltaColor}`}>{deltaText}</span>
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          State: {deltaArtifact.state}
        </div>
      </div>
    </button>
  );
}
