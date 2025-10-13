"use client";

import { addDaysUTC, todayUTC } from "@/lib/utils/time/datetime";
import { CalendarIcon } from "@heroicons/react/24/outline";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

type Props = {
  startDate: Date;
  endDate: Date;
  onRangeChange: (start: Date, end: Date) => void;
  placeholder?: string;
};

function yesterdayUTC(): Date {
  return addDaysUTC(todayUTC(), -1);
}

export default function DateRangePicker({
  startDate,
  endDate,
  onRangeChange,
  placeholder = "Select date range",
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    if (!inputRef.current) return;

    const fp = flatpickr(inputRef.current, {
      mode: "range",
      dateFormat: "M d, Y",
      defaultDate: [startDate, endDate],
      monthSelectorType: "static",
      static: true,
      disableMobile: true,
      maxDate: yesterdayUTC(), // bloquea futuro
      onChange: (dates) => {
        if (dates.length === 2) onRangeChange(dates[0], dates[1]);
      },
    });

    // Mostrar el rango actual en el input cuando cambian props
    const formatted = `${flatpickr.formatDate(
      startDate,
      "M d, Y"
    )} - ${flatpickr.formatDate(endDate, "M d, Y")}`;
    inputRef.current.value = formatted;

    return () => fp.destroy();
  }, [startDate, endDate, onRangeChange]);

  return (
    <div className="relative w-[250px] group flatpickr-host">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
        <CalendarIcon
          aria-hidden="true"
          className={`h-5 w-5 fill-none transition-colors ${
            isDark
              ? "stroke-gray-300 group-focus-within:stroke-brand-400"
              : "stroke-gray-500 group-focus-within:stroke-brand-600"
          }`}
        />
      </span>

      <input
        ref={inputRef}
        type="text"
        readOnly
        placeholder={placeholder}
        aria-label="Select date range"
        className={`
          h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pl-10 text-sm
          shadow-theme-xs placeholder:text-gray-400
          bg-transparent ${
            isDark
              ? "text-white/90 border-gray-700"
              : "text-gray-800 border-gray-300"
          }
          focus:outline-none focus:ring-3 ${
            isDark ? "dark:focus:border-brand-800" : ""
          }
          focus:ring-brand-500/20 focus:border-brand-300
        `}
      />
    </div>
  );
}
