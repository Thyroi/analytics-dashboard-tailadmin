"use client";

import React from "react";

export type Crumb = {
  label: string;
  onClick?: () => void;
};

type Props = {
  segments: Crumb[];
  className?: string;
};

export default function Breadcrumb({ segments, className = "" }: Props) {
  return (
    <nav className={`text-sm text-gray-700 dark:text-gray-300 ${className}`}>
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        return (
          <span key={i} className="inline-flex items-center">
            {seg.onClick && !isLast ? (
              <button
                onClick={seg.onClick}
                className="hover:underline"
                type="button"
              >
                {seg.label}
              </button>
            ) : (
              <span className={isLast ? "font-medium" : ""}>{seg.label}</span>
            )}
            {!isLast && <span className="mx-1">/</span>}
          </span>
        );
      })}
    </nav>
  );
}
