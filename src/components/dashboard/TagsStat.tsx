"use client";

import * as React from "react";

type HeroIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export default function TagStat({
  label,
  count,
  icon: Icon,
  iconClassName = "",
}: {
  label: string;
  count: number;
  icon: HeroIcon;
  iconClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl">
      <div className="flex items-center gap-3">
        <div
          className={`h-10 w-10 flex items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <span className="text-base font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      </div>
      <span className="text-xl font-semibold text-gray-900 dark:text-white">
        {count}
      </span>
    </div>
  );
}
