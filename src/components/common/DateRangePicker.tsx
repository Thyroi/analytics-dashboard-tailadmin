"use client";

import { addDaysUTC, todayUTC } from "@/lib/utils/time/datetime";
import { CalendarIcon } from "@heroicons/react/24/outline";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import { useEffect, useRef } from "react";

type Props = {
  startDate: Date;
  endDate: Date;
  onRangeChange: (start: Date, end: Date) => void;
  placeholder?: string;
};

/**
 * Retorna yesterday UTC - Única capa que debe clampar a ayer
 * 
 * ⚠️ CRÍTICO: Esta es la ÚNICA función que debe determinar el límite superior de fechas.
 * Ninguna otra capa debe restar días adicionales.
 */
function yesterdayUTC(): Date {
  return addDaysUTC(todayUTC(), -1);
}

/**
 * DateRangePicker - Única capa responsable de clamp a yesterday
 * 
 * POLÍTICA DE CLAMP:
 * - maxDate: yesterdayUTC() - Bloquea selección de fechas futuras
 * - onChange: Clamp end a yesterdayUTC() si excede
 * - NO aplicar offsets adicionales en otras capas
 * 
 * @remarks
 * Este componente es la ÚNICA capa que debe aplicar el clamp a ayer.
 * Los contextos y servicios deben confiar en estas fechas sin modificaciones adicionales.
 */
export default function DateRangePicker({
  startDate,
  endDate,
  onRangeChange,
  placeholder = "Select date range",
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    const maxDateLimit = yesterdayUTC();

    const fp = flatpickr(inputRef.current, {
      mode: "range",
      dateFormat: "M d, Y",
      defaultDate: [startDate, endDate],
      monthSelectorType: "static",
      static: true,
      disableMobile: true,
      maxDate: maxDateLimit, // bloquea futuro en UI
      onChange: (dates) => {
        if (dates.length === 2) {
          let [start, end] = dates;
          
          // CLAMP ÚNICO: Si end > yesterday, clampar a yesterday
          if (end > maxDateLimit) {
            end = maxDateLimit;
          }
          
          // CLAMP: Si start > end después del clamp, ajustar start
          if (start > end) {
            start = end;
          }
          
          onRangeChange(start, end);
        }
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
          className="h-5 w-5 fill-none transition-colors stroke-gray-500 dark:stroke-gray-300 group-focus-within:stroke-brand-600 dark:group-focus-within:stroke-brand-400"
        />
      </span>

      <input
        ref={inputRef}
        type="text"
        readOnly
        placeholder={placeholder}
        aria-label="Select date range"
        className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pl-10 text-sm shadow-theme-xs placeholder:text-gray-400 bg-transparent text-gray-800 dark:text-white/90 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-3 focus:ring-brand-500/20 focus:border-brand-300 dark:focus:border-brand-800"
      />
    </div>
  );
}
