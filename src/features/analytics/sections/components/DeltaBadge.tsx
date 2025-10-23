/**
 * Delta badge component for showing percentage changes
 */

import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

interface DeltaBadgeProps {
  text: string;
  variant: "positive" | "negative" | "neutral";
}

export function DeltaBadge({ text, variant }: DeltaBadgeProps) {
  const baseClasses =
    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium";

  const variantClasses = {
    positive:
      "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    negative: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    neutral: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  };

  const Icon =
    variant === "positive"
      ? ArrowTrendingUpIcon
      : variant === "negative"
      ? ArrowTrendingDownIcon
      : null;

  return (
    <span className={`${baseClasses} ${variantClasses[variant]}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {text}
    </span>
  );
}
