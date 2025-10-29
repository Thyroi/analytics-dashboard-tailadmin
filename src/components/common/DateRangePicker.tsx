"use client";

// No usar helpers UTC aquí: el calendario trabaja en horario LOCAL
import type { Granularity } from "@/lib/types";
import { CalendarIcon } from "@heroicons/react/24/outline";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import { useEffect, useRef } from "react";

type Props = {
  startDate: Date;
  endDate: Date;
  onRangeChange: (start: Date, end: Date) => void;
  placeholder?: string;
  granularity?: Granularity;
  mode?: "granularity" | "range";
  onPickerDatesUpdate?: (start: Date, end: Date) => void;
};

/**
 * Normaliza un Date (posiblemente en UTC) a medianoche LOCAL del mismo día
 * para interacción correcta con flatpickr (que usa timezone local).
 */
function toLocalMidnightFromUTC(d: Date): Date {
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Retorna "ayer" en horario UTC convertido a medianoche LOCAL
 *
 * POLÍTICA:
 * - Usar UTC para evitar desfases de timezone
 * - Convertir a medianoche local para flatpickr
 */
function yesterdayLocal(): Date {
  const now = new Date();
  // Calcular ayer en UTC (no en tiempo local)
  const todayUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  const yesterdayUTC = todayUTC - 24 * 60 * 60 * 1000;

  // Convertir a Date local para flatpickr
  const yesterdayDate = new Date(yesterdayUTC);
  return new Date(
    yesterdayDate.getUTCFullYear(),
    yesterdayDate.getUTCMonth(),
    yesterdayDate.getUTCDate()
  );
}

/**
 * DateRangePicker - Única capa responsable de clamp a yesterday
 *
 * POLÍTICA DE CLAMP:
 * - maxDate: yesterdayUTC() - Bloquea selección de fechas futuras
 * - onChange: Clamp end a yesterdayUTC() si excede
 * - NO aplicar offsets adicionales en otras capas
 *
 * POLÍTICA DE AJUSTE DE AÑO (UX para granularidad año):
 * - Si granularity='y', al abrir picker llama onPickerDatesUpdate con fechas ajustadas a 2025
 * - onPickerDatesUpdate actualiza contexto SIN cambiar mode ni disparar queries
 * - Ayuda a usuarios que no saben navegar años en el calendario
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
  granularity,
  onPickerDatesUpdate,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    const maxDateLimit = yesterdayLocal();

    // Normalizar fechas por defecto a medianoche LOCAL
    const defaultStartLocal = toLocalMidnightFromUTC(startDate);
    const defaultEndLocal = toLocalMidnightFromUTC(endDate);

    const fp = flatpickr(inputRef.current, {
      mode: "range",
      dateFormat: "M d, Y",
      defaultDate: [defaultStartLocal, defaultEndLocal],
      monthSelectorType: "static",
      static: true,
      disableMobile: true,
      maxDate: maxDateLimit, // bloquea futuro en UI
      onOpen: () => {
        // UX: Si granularidad es año, ajustar fechas a 2025 visualmente en el picker
        // NO actualizar contexto (eso recrearía flatpickr y cancelaría la apertura)
        if (granularity === "y") {
          const currentStart = fp.selectedDates[0];
          const currentEnd = fp.selectedDates[1];

          if (currentStart && currentEnd) {
            const currentYear = new Date().getFullYear(); // 2025

            // Ajustar al año actual manteniendo mes y día
            const newStart = new Date(
              currentYear,
              currentStart.getMonth(),
              currentStart.getDate()
            );
            const newEnd = new Date(
              currentYear,
              currentEnd.getMonth(),
              currentEnd.getDate()
            );

            // Clamp a yesterday si es necesario
            const clampedEnd = newEnd > maxDateLimit ? maxDateLimit : newEnd;
            const clampedStart = newStart > clampedEnd ? clampedEnd : newStart;

            // Actualizar SOLO flatpickr, SIN disparar onChange (triggerChange=false)
            fp.setDate([clampedStart, clampedEnd], false);
          }
        }
      },
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
      defaultStartLocal,
      "M d, Y"
    )} - ${flatpickr.formatDate(defaultEndLocal, "M d, Y")}`;
    inputRef.current.value = formatted;

    return () => fp.destroy();
  }, [startDate, endDate, onRangeChange, granularity, onPickerDatesUpdate]);

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
