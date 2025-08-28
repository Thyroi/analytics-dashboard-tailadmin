"use client";

import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import { CalendarIcon } from "@heroicons/react/24/outline";

type Props = {
  startDate: Date;
  endDate: Date;
  onRangeChange: (start: Date, end: Date) => void;
};

export default function DateRangePicker({ startDate, endDate, onRangeChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    const fp = flatpickr(inputRef.current, {
      mode: "range",
      dateFormat: "M d, Y",
      defaultDate: [startDate, endDate],
      monthSelectorType: "static",
      positionElement: inputRef.current,
      onReady: () => {
        if (inputRef.current) {
          inputRef.current.value = `${flatpickr.formatDate(startDate, "M d, Y")} - ${flatpickr.formatDate(endDate, "M d, Y")}`;
        }
      },
      onChange: (dates) => {
        if (dates.length === 2) {
          onRangeChange(dates[0], dates[1]);
        }
      },
    });

    return () => fp.destroy();
  }, [startDate, endDate, onRangeChange]);

  return (
    <div className="relative w-[250px]">
      <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <CalendarIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
      </span>

      <input
        ref={inputRef}
        type="text"
        readOnly
        className="
          h-11 w-full rounded-lg border border-gray-300 bg-transparent 
          pl-10 pr-4 text-sm font-medium text-gray-800 
          placeholder:text-gray-400 focus:border-brand-300 focus:ring-2 
          focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 
          dark:text-white/90 dark:placeholder:text-white/30 
          dark:focus:border-brand-800
        "
      />
    </div>
  );
}
